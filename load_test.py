#!/usr/bin/env python3
"""
Zero-dependency artificial load generator for Expenso.
Supports custom load and automated Zero -> High Load -> Zero Load spike test.
"""

import sys
import time
import argparse
import urllib.request
import urllib.error
import json
from concurrent.futures import ThreadPoolExecutor

ENDPOINTS = [
    ("GET", "/api/health", None),
    ("GET", "/", None),
    ("POST", "/api/auth/login", json.dumps({"email": "demo@expense.app", "password": "demo1234"}).encode("utf-8")),
    ("POST", "/api/auth/login", json.dumps({"email": "wrong@expense.app", "password": "wrong"}).encode("utf-8")),
]

def send_request(base_url, method, path, data=None):
    url = f"{base_url.rstrip('/')}{path}"
    headers = {"Content-Type": "application/json"} if data else {}
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    start = time.time()
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status, time.time() - start
    except urllib.error.HTTPError as e:
        return e.code, time.time() - start
    except Exception as e:
        return 0, time.time() - start

def worker(base_url, duration, stats):
    end_time = time.time() + duration
    idx = 0
    while time.time() < end_time:
        method, path, data = ENDPOINTS[idx % len(ENDPOINTS)]
        idx += 1
        status, latency = send_request(base_url, method, path, data)
        stats['total'] += 1
        stats['statuses'][status] = stats['statuses'].get(status, 0) + 1
        stats['latencies'].append(latency)

def run_load(base_url, concurrency, duration):
    stats = {'total': 0, 'statuses': {}, 'latencies': []}
    start_time = time.time()

    with ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = [executor.submit(worker, base_url, duration, stats) for _ in range(concurrency)]
        for f in futures:
            f.result()

    elapsed = time.time() - start_time
    total = stats['total']
    rps = total / elapsed if elapsed > 0 else 0
    avg_latency = (sum(stats['latencies']) / len(stats['latencies']) * 1000) if stats['latencies'] else 0

    return total, rps, avg_latency, dict(stats['statuses']), elapsed

def countdown(seconds, message):
    for remaining in range(seconds, 0, -1):
        sys.stdout.write(f"\r  ⏱️  {message}: {remaining}s remaining... ")
        sys.stdout.flush()
        time.sleep(1)
    sys.stdout.write("\r" + " " * 75 + "\r")
    sys.stdout.flush()

def main():
    parser = argparse.ArgumentParser(description="Generate artificial HTTP load for Grafana testing.")
    parser.add_argument("--url", default="http://localhost:5000", help="Base URL of application")
    parser.add_argument("-c", "--concurrency", type=int, default=20, help="Number of concurrent workers (default: 20)")
    parser.add_argument("-d", "--duration", type=int, default=30, help="Duration in seconds (default: 30)")
    parser.add_argument("--spike", action="store_true", help="Run automated Zero -> High Load -> Zero Load sequence")
    args = parser.parse_args()

    print("=" * 65)
    print("  📊 Expenso Monitoring Load Test")
    print("  Target App:   " + args.url)
    print("  Grafana URL:  http://localhost:3000/d/ag2iycj3pedc0e/kubernetes-and-devops-monitoring")
    print("=" * 65)

    if args.spike:
        print("\n[PHASE 1/3] 🟢 ZERO LOAD BASELINE (15 seconds)")
        print("  Observe Grafana: Curves are completely FLAT (~0 req/sec, ~0% CPU)")
        countdown(15, "Maintaining Zero Load")

        print("\n[PHASE 2/3] 🔴 HIGH LOAD SPIKE (30 concurrent workers for 35 seconds)")
        print("  Observe Grafana: Watch request rate & CPU SPIKE sharply upward!")
        total, rps, latency, statuses, elapsed = run_load(args.url, concurrency=35, duration=35)
        print(f"  ⚡ Spike Finished! Sent {total} requests (~{rps:.1f} req/sec | avg latency {latency:.1f}ms)")
        print(f"  ⚡ HTTP Responses: {statuses}")

        print("\n[PHASE 3/3] 🟢 COOLDOWN / RECOVERY (15 seconds)")
        print("  Observe Grafana: Watch curves DROP back to baseline flatline!")
        countdown(15, "Maintaining Cooldown")

        print("\n" + "=" * 65)
        print("  ✅ Zero -> High Load -> Zero Load Test Complete!")
        print("  Check Grafana to view the full bell-curve spike & recovery!")
        print("=" * 65)
    else:
        print(f"\n🚀 Running Load: {args.concurrency} workers for {args.duration}s...")
        total, rps, latency, statuses, elapsed = run_load(args.url, args.concurrency, args.duration)
        print("\n" + "=" * 65)
        print("  ✅ Load Test Completed!")
        print(f"  Total Requests:     {total}")
        print(f"  Duration:           {elapsed:.2f}s")
        print(f"  Average Throughput: {rps:.2f} req/sec")
        print(f"  Avg Latency:        {latency:.2f}ms")
        print(f"  Status Codes:       {statuses}")
        print("=" * 65)

if __name__ == "__main__":
    main()
