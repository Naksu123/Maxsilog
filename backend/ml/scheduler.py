"""
AutoValuate Automated Daily Scheduler
Configured for daily execution at 02:00 AM Malaysia Time (Asia/Kuala_Lumpur, UTC+8).
"""

import os
import sys
import argparse
import pytz
from typing import Optional
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

# Ensure path resolution
base_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.normpath(os.path.join(base_dir, ".."))
project_root = os.path.normpath(os.path.join(base_dir, "..", ".."))
for p in [project_root, backend_dir, base_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

from .retrain_manager import RetrainManager, MYT_TIMEZONE

GLOBAL_SCHEDULER: Optional[BackgroundScheduler] = None


def daily_retraining_job(manager: RetrainManager):
    """Worker function executed by APScheduler daily at 2:00 AM MYT."""
    print("[SCHEDULER] Triggering scheduled daily ML retraining job (02:00 AM MYT)...")
    res = manager.run_retraining(trigger="scheduled_daily", force=False)
    print(f"[SCHEDULER] Scheduled job outcome: {res.get('status')} - {res.get('message', res.get('error'))}")


def start_daily_scheduler(retrain_manager: RetrainManager) -> BackgroundScheduler:
    """Initialize and start persistent background scheduler at 02:00 AM Asia/Kuala_Lumpur."""
    global GLOBAL_SCHEDULER
    if GLOBAL_SCHEDULER is not None and GLOBAL_SCHEDULER.running:
        return GLOBAL_SCHEDULER

    scheduler = BackgroundScheduler(timezone=MYT_TIMEZONE)
    # Cron trigger: 2:00 AM every day in Asia/Kuala_Lumpur
    trigger = CronTrigger(
        hour=2,
        minute=0,
        second=0,
        timezone=MYT_TIMEZONE
    )

    scheduler.add_job(
        func=daily_retraining_job,
        trigger=trigger,
        args=[retrain_manager],
        id="autovaluate_daily_retraining",
        name="AutoValuate Daily Model Retraining (02:00 AM MYT)",
        replace_existing=True,
        max_instances=1
    )

    scheduler.start()
    GLOBAL_SCHEDULER = scheduler
    print("[+] APScheduler started successfully. Daily job scheduled at 02:00 AM Asia/Kuala_Lumpur.")
    return scheduler


def shutdown_scheduler():
    global GLOBAL_SCHEDULER
    if GLOBAL_SCHEDULER is not None and GLOBAL_SCHEDULER.running:
        GLOBAL_SCHEDULER.shutdown(wait=False)
        print("[+] APScheduler shut down cleanly.")
        GLOBAL_SCHEDULER = None


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AutoValuate Daily Retraining Scheduler & CLI Runner")
    parser.add_argument("--run-now", action="store_true", help="Execute retraining immediately and exit")
    parser.add_argument("--force", action="store_true", help="Force retraining even if dataset is unchanged")
    args = parser.parse_args()

    manager = RetrainManager()
    if args.run_now:
        print("[CLI] Executing immediate retraining run...")
        outcome = manager.run_retraining(trigger="cli_runner", force=args.force)
        print("Outcome:", outcome)
    else:
        sched = start_daily_scheduler(manager)
        print("[CLI] Scheduler running. Press Ctrl+C to terminate.")
        try:
            import time
            while True:
                time.sleep(1)
        except (KeyboardInterrupt, SystemExit):
            shutdown_scheduler()
