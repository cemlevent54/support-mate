from config.redis import select_and_rotate_agent

class SelectAndRotateAgentQueryHandler:
    def execute(self):
        return select_and_rotate_agent() 