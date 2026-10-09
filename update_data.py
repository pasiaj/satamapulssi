#!/usr/bin/env python3
"""Fetch realized FIOUL port calls and publish a compact monthly JSON snapshot."""
from __future__ import annotations

import collections
import datetime as dt
import json
import pathlib
import subprocess
import urllib.parse
from zoneinfo import ZoneInfo

BASE = 'https://meri.digitraffic.fi/api/port-call/v1/port-calls'
ROOT = pathlib.Path(__file__).resolve().parent
FIRST_YEAR = 2018
AREAS = {'OR': 'Oritkari', 'VS': 'Vihreäsaari', 'NS': 'Nuottasaari'}
TYPES = {
    '70': 'Kuivalastialus', '40': 'Roroalus', '50': 'Konttialus',
    '60': 'Kuivabulkalus', '80': 'Säiliöalus, tarkentamaton',
    '81': 'Öljysäiliöalus', '82': 'Kaasusäiliöalus',
    '83': 'Kemikaalisäiliöalus', '93': 'Proomu', '91': 'Hinaaja',
    '90': 'Muu alus', '10': 'Matkustaja-alus', '94': 'Puskija',
    '95': 'Puskuproomu', '97': 'Muu koneeton alus',
}


def parse(value):
    try:
        return dt.datetime.fromisoformat(value.replace('Z', '+00:00')) if value else None
    except ValueError:
        return None


def fetch_year(year):
    params = urllib.parse.urlencode({
        'locode': 'FIOUL',
        'ataFrom': f'{year}-01-01T00:00:00.000Z',
        'ataTo': f'{year + 1}-01-01T00:00:00.000Z',
    })
    response = subprocess.run(
        ['curl', '--compressed', '-fSsL', '--max-time', '45', BASE + '?' + params],
        capture_output=True, text=True, check=True,
    )
    payload = json.loads(response.stdout)
    calls = payload['portCalls']
    if len(calls) >= 1000:
        raise RuntimeError(f'{year}: API result reached 1000; split the query before publishing')
    return calls, payload.get('dataUpdatedTime')


def main():
    now = dt.datetime.now(dt.timezone.utc)
    by_id = {}
    source_updates = []
    for year in range(FIRST_YEAR, now.year + 1):
        calls, updated = fetch_year(year)
        source_updates.append(updated)
        for call in calls:
            by_id[call['portCallId']] = call

    counts = collections.Counter()
    arrivals = []
    for call in by_id.values():
        actuals = []
        for detail in call.get('portAreaDetails') or []:
            arrived = parse(detail.get('ata'))
            if arrived and dt.datetime(FIRST_YEAR, 1, 1, tzinfo=dt.timezone.utc) <= arrived <= now:
                actuals.append((arrived, detail))
        if not actuals:
            continue
        arrived, detail = min(actuals, key=lambda item: item[0])
        area = detail.get('portAreaCode') or 'MUU'
        if area not in AREAS:
            area = 'MUU'
        type_code = str(call.get('vesselTypeCode') or '')
        if type_code not in TYPES:
            type_code = '90'
        month = arrived.astimezone(ZoneInfo('Europe/Helsinki')).strftime('%Y-%m')
        counts[(month, area, type_code)] += 1
        arrivals.append(arrived)

    assert arrivals, 'No realized arrivals returned'
    months = [
        {'month': month, 'area': area, 'type': type_code, 'count': count}
        for (month, area, type_code), count in sorted(counts.items())
    ]
    result = {
        'source': BASE,
        'locode': 'FIOUL',
        'retrieved_at': now.replace(microsecond=0).isoformat().replace('+00:00', 'Z'),
        'source_updated_at': max((x for x in source_updates if x), default=None),
        'first_arrival': min(arrivals).date().isoformat(),
        'last_arrival': max(arrivals).date().isoformat(),
        'visits': len(arrivals),
        'month_timezone': 'Europe/Helsinki',
        'areas': {**AREAS, 'MUU': 'Muu tai tuntematon'},
        'types': TYPES,
        'months': months,
    }
    target = ROOT / 'data.json'
    temporary = ROOT / 'data.json.tmp'
    temporary.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n')
    temporary.replace(target)
    print(f'{target}: {len(arrivals)} arrivals, {len(months)} monthly cells')


if __name__ == '__main__':
    main()
