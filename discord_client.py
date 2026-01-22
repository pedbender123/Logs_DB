import os
import httpx
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DISCORD_BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN")

async def send_message(channel_id: str, content: str):
    """
    Sends a simple message to a Discord channel.
    """
    if not DISCORD_BOT_TOKEN:
        logger.error("DISCORD_BOT_TOKEN is not set")
        return

    url = f"https://discord.com/api/v10/channels/{channel_id}/messages"
    headers = {
        "Authorization": f"Bot {DISCORD_BOT_TOKEN}",
        "Content-Type": "application/json"
    }
    
    # Discord has a 2000 char limit for content. 
    # We'll truncate if necessary, though ideally we'd paginate.
    if len(content) > 2000:
        content = content[:1990] + "..."
    
    json_data = {"content": content}
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=json_data)
            response.raise_for_status()
            logger.info(f"Sent Discord message to {channel_id}")
    except httpx.HTTPStatusError as e:
        logger.error(f"Failed to send Discord message: {e.response.text}")
    except Exception as e:
        logger.error(f"Error sending Discord message: {e}")

async def send_embed(channel_id: str, title: str, description: str, color: int = 0x3498db, fields: list = None):
    """
    Sends a rich embed message to a Discord channel.
    """
    if not DISCORD_BOT_TOKEN:
        logger.error("DISCORD_BOT_TOKEN is not set")
        return

    url = f"https://discord.com/api/v10/channels/{channel_id}/messages"
    headers = {
        "Authorization": f"Bot {DISCORD_BOT_TOKEN}",
        "Content-Type": "application/json"
    }
    
    embed = {
        "title": title,
        "description": description[:4090] if description else "", # Limit description
        "color": color,
        "type": "rich"
    }
    
    if fields:
        embed["fields"] = fields

    json_data = {"embeds": [embed]}
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=json_data)
            response.raise_for_status()
            logger.info(f"Sent Discord embed to {channel_id}")
    except httpx.HTTPStatusError as e:
        logger.error(f"Failed to send Discord embed: {e.response.text}")
    except Exception as e:
        logger.error(f"Error sending Discord embed: {e}")
