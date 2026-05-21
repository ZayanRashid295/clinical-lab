#!/usr/bin/env bash
# Seed dummy data across MedPrep (4 modes), dashboard, study, achievements,
# community, study groups, and help/feedback.
#
# Usage:
#   ./scripts/seed-demo-full.sh
#   ./scripts/seed-demo-full.sh --reset
#   ./scripts/seed-demo-full.sh --email=learner@clinicallab.test --reset
#
set -euo pipefail
cd "$(dirname "$0")/.."
npm run prisma:seed:demo -- "$@"
