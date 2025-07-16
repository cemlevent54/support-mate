class QueryHandler:
    def __init__(self):
        self.handlers = {}

    def register(self, query_type, handler):
        self.handlers[query_type] = handler
        print(f"[QueryHandler] Registered handler for: {query_type}")

    async def dispatch(self, query_type, query):
        handler = self.handlers.get(query_type)
        if not handler:
            error = f"No handler registered for query: {query_type}"
            print(f"[QueryHandler] {error}")
            raise Exception(error)
        try:
            print(f"[QueryHandler] Dispatching query: {query_type} {query}")
            result = await handler.execute(query)
            print(f"[QueryHandler] Success: {query_type} {result}")
            return result
        except Exception as error:
            print(f"[QueryHandler] Fail: {query_type} {error} {query}")
            raise error

    def execute(self, *args, **kwargs):
        raise NotImplementedError("execute metodu override edilmeli.")

# Global instance
query_handler = QueryHandler()
