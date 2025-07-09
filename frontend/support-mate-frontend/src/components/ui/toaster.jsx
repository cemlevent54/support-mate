"use client"

import {
  Toaster as ChakraToaster,
  Portal,
} from "@chakra-ui/react"

export const Toaster = () => {
  return (
    <Portal>
      <ChakraToaster />
    </Portal>
  )
} 