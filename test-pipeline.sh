#!/bin/bash
API="https://safedeal-brm4.onrender.com/api/v1/properties"
echo "Starting analysis..."
RES=$(curl -s -X POST $API/analyze -H "Content-Type: application/json" -d '{"personal":{},"location":{"city":"Tel Aviv"},"deal":{},"documents":{}}')
echo "Response: $RES"
JOBID=$(echo $RES | grep -o '"jobId":"[^"]*' | cut -d'"' -f4)

if [ -z "$JOBID" ]; then
  echo "Failed to get jobId"
  exit 1
fi
echo "Got jobId: $JOBID"

for i in {1..10}; do
  echo "Polling status... ($i)"
  curl -s $API/status/$JOBID
  echo ""
  sleep 2
done
