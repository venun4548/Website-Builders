"""
Website Builders — Web Push Notification Service
Dispatches browser push notifications using VAPID keys and pywebpush.
"""

import json
import logging
import os
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Default VAPID keys for demo/fallback if env vars not provided
DEFAULT_VAPID_PUBLIC = os.getenv("VAPID_PUBLIC_KEY", "BN7F9aXyZ0k8-qW2mL4oP1vR6tY3uI5oK8jN2mP4qL7sT9vW1xY3z5A7bC9dE1fG3hJ5lK7nM9pQ1rS3tU5vW7xY9zA")
DEFAULT_VAPID_PRIVATE = os.getenv("VAPID_PRIVATE_KEY", "b3X_9Qz2mL4oP1vR6tY3uI5oK8jN2mP4qL7sT9vW1xA")
DEFAULT_VAPID_CLAIMS = {
    "sub": os.getenv("VAPID_SUBJECT", "mailto:websitebuildeers@gmail.com")
}

class PushService:
    @staticmethod
    def get_public_key() -> str:
        return os.getenv("VAPID_PUBLIC_KEY", DEFAULT_VAPID_PUBLIC)

    @staticmethod
    def send_push(subscription_info: Dict[str, Any], payload: Dict[str, Any]) -> bool:
        """
        Sends a web push notification to a browser subscription.
        subscription_info should contain endpoint, keys: { p256dh, auth }
        """
        try:
            from pywebpush import webpush, WebPushException
            
            payload_str = json.dumps({
                "title": payload.get("title", "Website Builders"),
                "body": payload.get("body", "You have a new update."),
                "icon": payload.get("icon", "/images/logo.png"),
                "badge": payload.get("badge", "/images/logo.png"),
                "url": payload.get("url", "/customer/dashboard")
            })

            webpush(
                subscription_info=subscription_info,
                data=payload_str,
                vapid_private_key=os.getenv("VAPID_PRIVATE_KEY", DEFAULT_VAPID_PRIVATE),
                vapid_claims=DEFAULT_VAPID_CLAIMS
            )
            logger.info("Successfully sent push notification to %s", subscription_info.get("endpoint", "")[:30])
            return True
        except ImportError:
            logger.warning("pywebpush is not installed. Push notification skipped.")
            return False
        except Exception as e:
            logger.error("Failed to send push notification: %s", str(e))
            return False
