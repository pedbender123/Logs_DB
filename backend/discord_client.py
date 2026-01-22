import os
import logging
import discord
import asyncio
import re
import ai_service

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DISCORD_BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN")

# Intent setup
intents = discord.Intents.default()
intents.messages = True
intents.message_content = True

class LogBotClient(discord.Client):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    async def on_ready(self):
        logger.info(f'Logged in as {self.user} (ID: {self.user.id})')

    async def on_message(self, message):
        # Don't reply to ourselves
        if message.author.id == self.user.id:
            return

        # Check if the bot is mentioned OR if it's a direct reply or just specific keywords
        # User asked to just mention the bot with the ID.
        if self.user.mentioned_in(message):
            content = message.content.lower()
            
            # Simple regex to find a number in the message
            # e.g. "@Bot 123", "analyze 123", "relatorio 123"
            match = re.search(r'\b(\d+)\b', content)
            
            if match:
                log_id = int(match.group(1))
                await message.reply(f"🔍 Analisando log **#{log_id}**, aguarde um momento...")
                
                # We need the system_id logic. But generate_ai_report takes system_id and log_id.
                # However, from the ID alone we might retrieve the log and find the system_id.
                # Let's adjust ai_service to maybe fetch system_id from the log if we only have log_id?
                # Or we can just look up the log first here.
                # Actually, `ai_service.generate_ai_report` takes `system_id` AND `log_id`.
                # Let's verify if we can get system_id from just log_id in DB.
                # We don't have DB access here easily unless we import SessionLocal etc.
                # Let's import it.
                
                from database import SessionLocal
                from models import Log
                
                db = SessionLocal()
                try:
                    log_entry = db.query(Log).filter(Log.id == log_id).first()
                    if not log_entry:
                        await message.reply(f"❌ Log #{log_id} não encontrado.")
                        return
                    
                    system_id = log_entry.system_id
                    
                    report = await ai_service.generate_ai_report(system_id, log_id)
                    
                    if report:
                        # Chunk the report if too long
                        header = f"📋 **RELATÓRIO TÉCNICO: Log #{log_id}**\n\n"
                        full_msg = header + report
                        
                        if len(full_msg) > 2000:
                             # rudimentary chunking
                            for i in range(0, len(full_msg), 1900):
                                await message.reply(full_msg[i:i+1900])
                        else:
                            await message.reply(full_msg)
                    else:
                         await message.reply(f"❌ Falha ao gerar relatório para o log #{log_id}.")

                except Exception as e:
                    logger.error(f"Error executing command: {e}")
                    await message.reply("❌ Ocorreu um erro interno ao processar seu pedido.")
                finally:
                    db.close()

bot_client = LogBotClient(intents=intents)

async def start_bot():
    """Starts the persistent Discord bot connection."""
    if not DISCORD_BOT_TOKEN:
        logger.error("DISCORD_BOT_TOKEN is not set")
        return
    
    try:
        await bot_client.start(DISCORD_BOT_TOKEN)
    except Exception as e:
        logger.error(f"Error starting Discord bot: {e}")

async def send_message(channel_id: str, content: str):
    """
    Sends a message using the persistent client if available.
    """
    if not bot_client.is_ready():
        logger.warning("Bot is not ready yet, attempting to wait or skip...")
        # In a real app we might wait or queue. For now let's hope it connects fast.
        # or we can use a temporary rest call if the bot gateway isn't ready?
        # But `bot_client.start` should have been called.
        pass

    try:
        channel = bot_client.get_channel(int(channel_id))
        if not channel:
            # Maybe fetch it
            try:
                channel = await bot_client.fetch_channel(int(channel_id))
            except Exception as e:
                logger.error(f"Could not fetch channel {channel_id}: {e}")
                return

        if len(content) > 2000:
            content = content[:1990] + "..."
            
        await channel.send(content)
        logger.info(f"Sent Discord message to {channel_id}")
        
    except Exception as e:
        logger.error(f"Error sending Discord message via client: {e}")
