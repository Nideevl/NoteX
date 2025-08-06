"use client"

import type React from "react"
import { useState, useRef, useEffect, type KeyboardEvent } from "react"
import styles from '@/components/editor.module.css'

interface TextBlock {
  id: string
  content: string
}

export default function Component() {
  const [blocks, setBlocks] = useState<TextBlock[]>([{ id: "1", content: "" }])
  const [focusedBlockId, setFocusedBlockId] = useState<string>("1")
  const blockRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>, blockId: string) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()

      // Create new block
      const newBlockId = Date.now().toString()
      const currentBlockIndex = blocks.findIndex((block) => block.id === blockId)

      setBlocks((prevBlocks) => {
        const newBlocks = [...prevBlocks]
        newBlocks.splice(currentBlockIndex + 1, 0, {
          id: newBlockId,
          content: "",
        })
        return newBlocks
      })

      // Focus the new block after it's created
      setFocusedBlockId(newBlockId)
    } else if (e.key === "Backspace") {
      const currentBlock = blocks.find((block) => block.id === blockId)
      const currentBlockIndex = blocks.findIndex((block) => block.id === blockId)

      // If the block is empty and it's not the only block, remove it
      if (currentBlock?.content === "" && blocks.length > 1) {
        e.preventDefault()

        setBlocks((prevBlocks) => prevBlocks.filter((block) => block.id !== blockId))

        // Focus the previous block if it exists, otherwise focus the next one
        const previousBlock = blocks[currentBlockIndex - 1]
        const nextBlock = blocks[currentBlockIndex + 1]

        if (previousBlock) {
          setFocusedBlockId(previousBlock.id)
        } else if (nextBlock) {
          setFocusedBlockId(nextBlock.id)
        }
      }
    }
  }

  const handleInput = (e: React.FormEvent<HTMLDivElement>, blockId: string) => {
    const content = e.currentTarget.textContent || ""

    setBlocks((prevBlocks) => prevBlocks.map((block) => (block.id === blockId ? { ...block, content } : block)))
  }

  const handleFocus = (blockId: string) => {
    setFocusedBlockId(blockId)
  }

  // Focus the block when focusedBlockId changes
  useEffect(() => {
    if (focusedBlockId && blockRefs.current[focusedBlockId]) {
      const element = blockRefs.current[focusedBlockId]
      element?.focus()

      // Move cursor to end of content
      const range = document.createRange()
      const selection = window.getSelection()
      if (element && selection) {
        range.selectNodeContents(element)
        range.collapse(false)
        selection.removeAllRanges()
        selection.addRange(range)
      }
    }
  }, [focusedBlockId])

return (
  <div className={styles.container}>
    <div className={styles.blockList}>
      {blocks.map((block, index) => (
        <div
          key={block.id}
          ref={(el) => {
            blockRefs.current[block.id] = el;
          }}
          contentEditable
          suppressContentEditableWarning={true}
          className={styles.block}
          data-placeholder={index === 0 ? "Start writing..." : "Type '/' for commands"}
          onKeyDown={(e) => handleKeyDown(e, block.id)}
          onInput={(e) => handleInput(e, block.id)}
          onFocus={() => handleFocus(block.id)}
        />
      ))}
    </div>

    <div className={styles.instructions}>
      <h3>How to use:</h3>
      <ul>
        <li>• Press <kbd>Enter</kbd> to create a new block</li>
        <li>• Press <kbd>Backspace</kbd> on an empty block to delete it</li>
        <li>• Click on any block to focus and start typing</li>
      </ul>
    </div>
  </div>
);
}
