class CommandHandler:
    def __init__(self):
        self.handlers = {}

    def register(self, command_type, handler):
        self.handlers[command_type] = handler
        print(f"[CommandHandler] Registered handler for: {command_type}")

    async def dispatch(self, command_type, command):
        handler = self.handlers.get(command_type)
        if not handler:
            error = f"No handler registered for command type: {command_type}"
            print(f"[CommandHandler] {error}")
            raise Exception(error)
        try:
            print(f"[CommandHandler] Dispatching command: {command_type} {command}")
            result = await handler.execute(command)
            print(f"[CommandHandler] Success: {command_type} {result}")
            return result
        except Exception as error:
            print(f"[CommandHandler] Fail: {command_type} {error} {command}")
            raise error

    def execute(self, *args, **kwargs):
        raise NotImplementedError("execute metodu override edilmeli.")

# Global instance
command_handler = CommandHandler()
