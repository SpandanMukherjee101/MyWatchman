# Manager APIs

### Watchman Utilities
| Method | Endpoint | Description |
|---------|-----------|-------------|                
| GET | manager/watchman/activity/details/ | Get watchman activity details | duty and steps current shift
| GET | manager/watchman/activity/logs/:wid/:pg | Get activity logs |

## Analytics
| Method | Endpoint | Description |
|---------|-----------|-------------|
| GET | manager/analytics | Fetch global analytics for dashboard |               


## WebSocket Channels
| Channel | Description |
|----------|-------------|
| manager/watchman/live/alert | Firebase |

# Watchman APIs

## Activity
| Method | Endpoint | Description |
|---------|-----------|-------------|
| GET | watchman/getActivity/ | Get activity summary | duty and steps current shift
| GET | watchman/getActivity/logs/:pg | Get activity logs |


| POST | watchman/activity/log | Log alert button press |


## QR Mode & Visitor Logs
| Method | Endpoint | Description |
|---------|-----------|-------------|
| POST | watchman/building/qrmode/scan| Scan building QR code (validate/next checkpoint) |