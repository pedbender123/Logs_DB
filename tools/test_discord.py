import asyncio
from dotenv import load_dotenv
import os

load_dotenv()
import discord_client

async def test():
    error_channel = os.getenv("DISCORD_ERROR_CHANNEL_ID")
    report_channel = os.getenv("DISCORD_REPORT_CHANNEL_ID")
    
    print(f"Testing Error Channel: {error_channel}")
    await discord_client.send_message(error_channel, "🚨 **TESTE**: Verificação de Canal de Erros bem sucedida.")
    
    print(f"Testing Report Channel: {report_channel}")
    await discord_client.send_message(report_channel, "✅ **TESTE**: Verificação de Canal de Relatórios bem sucedida.")

if __name__ == "__main__":
    asyncio.run(test())
