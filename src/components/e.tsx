"use client"

import styles from './editor.module.css'
import { useRef, useEffect, useState, type KeyboardEvent, type DragEvent } from "react"
import { cn } from "@/lib/utils"

interface Block {
    id: string
    content: string
}

export default function Editor() {
    const [blocks, setBlocks] = useState<Block[]>([{ id: "1", content: "" }])
    const [focusedBlockId, setFocusedBlockId] = useState<string>("1")
    const blockRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

    // State for drag and drop
    const [draggedId, setDraggedId] = useState<string | null>(null)
    const [dragOverId, setDragOverId] = useState<string | null>(null)

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>, blockId: string, index: number) => {
        if (e.key === "Enter") {
            e.preventDefault()

            const newBlockId = Date.now().toString();

            setBlocks((prevBlocks) => {
                const newBlocks = [...prevBlocks]
                newBlocks.splice( index + 1, 0 , {
                    id : newBlockId,
                    content : ""
                })
                return newBlocks
            })
            setFocusedBlockId(newBlockId)
            
        } else if (e.key === "Backspace") { 
            const currentBlock = blocks.find((block) => block.id === blockId)

            if (currentBlock?.content === "" && blocks.length > 1) {
                e.preventDefault()

                setBlocks((prevBlocks) => prevBlocks.filter((block) => block.id != blockId))

                const previousBlock = blocks[index - 1]
                const nextBlock = blocks[index + 1]

                if (previousBlock) {
                    setFocusedBlockId(previousBlock.id)
                } else {
                    setFocusedBlockId(nextBlock.id)
                }
            }

        } else if(e.key === "ArrowUp"){
            const previousBlock = blocks.find((block) => block.id === blocks[index - 1]?.id)
            if(previousBlock) setFocusedBlockId(previousBlock.id)
        } else if(e.key === "ArrowDown"){
            const nextBlock = blocks.find((block) => block.id === blocks[index + 1]?.id)
            if(nextBlock) setFocusedBlockId(nextBlock.id)
    }
    }

    const handleInput = (e: React.FormEvent<HTMLDivElement>, blockId: string) => {
        const content = e.currentTarget.textContent || ""
        setBlocks((prevBlocks) => prevBlocks.map((block) => block.id === blockId ? { ...block, content } : block))
    }

    const placeHolderText = (index: number, blockId: string) => {
        if (index === 0 && blocks.length === 1) {
            return "Start Writing From Here...."
        } else if (focusedBlockId === blockId) {
            return "You are here..."
        }
        return ""
    }

    useEffect(() => {
        if (focusedBlockId && blockRefs.current[focusedBlockId]) {
            const element = blockRefs.current[focusedBlockId]
            if (element) {
                element.focus()
                const range = document.createRange() // Okay browser, I’m ready to mark some text — but I haven’t selected anything yet.
                const selection = window.getSelection() // tells where the cursor is or what text is selected by the user on the page right now
                if (selection) {
                    range.selectNodeContents(element) // Selects (highlights) all content inside the given element
                    range.collapse(false) // Places the cursor at the end of the selected content.
                    selection.removeAllRanges() // Removes the selection highlight
                    selection.addRange(range) // Actually show the new cursor/ to tell when to actually apply that range and call the cursor at that desired position
                }
            }
        }
    }, [focusedBlockId, blocks.length]) // Added blocks.length to dependency array to re-focus after block deletion/addition

    // Drag and Drop Handlers
    const handleDragStart = (e: DragEvent<HTMLDivElement>, blockId: string) => {
        setDraggedId(blockId)
        e.dataTransfer.effectAllowed = "move"
        // Set a dummy data to make drag work in some browsers (e.g., Firefox)
        e.dataTransfer.setData("text/plain", blockId)
    }

    const handleDragOver = (e: DragEvent<HTMLDivElement>, blockId: string) => {
        e.preventDefault() // Necessary to allow dropping
        if (draggedId !== blockId) {
            setDragOverId(blockId)
        }
    }

    const handleDragLeave = () => {
        setDragOverId(null)
    }

    const handleDrop = (e: DragEvent<HTMLDivElement>, dropTargetId: string) => {
        e.preventDefault()
        if (!draggedId || draggedId === dropTargetId) {
            setDraggedId(null)
            setDragOverId(null)
            return
        }

        setBlocks((prevBlocks) => {
            const newBlocks = [...prevBlocks]
            const draggedIndex = newBlocks.findIndex((block) => block.id === draggedId)
            const dropTargetIndex = newBlocks.findIndex((block) => block.id === dropTargetId)

            if (draggedIndex === -1 || dropTargetIndex === -1) {
                return prevBlocks // Should not happen
            }

            const [removed] = newBlocks.splice(draggedIndex, 1)
            newBlocks.splice(dropTargetIndex, 0, removed)

            return newBlocks
        })

        setFocusedBlockId(draggedId) // Keep focus on the dragged block after drop
        setDraggedId(null)
        setDragOverId(null)
    }

    const handleDragEnd = () => {
        setDraggedId(null)
        setDragOverId(null)
    }

    return (
        <div className={styles.container}>
            <div className={styles.blockList}>
                {blocks.map((block, index) => (
                    <div
                        key={block.id}
                        ref={(el) => { blockRefs.current[block.id] = el }}
                        contentEditable
                        suppressContentEditableWarning={true}
                        className={cn(
                            styles.block,
                            draggedId === block.id && styles.dragging,
                            dragOverId === block.id && styles.dragOver
                        )}
                        data-placeholder={placeHolderText(index, block.id)}
                        onKeyDown={(e) => handleKeyDown(e, block.id, index)}
                        onInput={(e) => handleInput(e, block.id)}
                        onFocus={() => setFocusedBlockId(block.id)}
                        // Drag and Drop props
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, block.id)}
                        onDragOver={(e) => handleDragOver(e, block.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, block.id)}
                        onDragEnd={handleDragEnd}
                    >
                    </div>
                ))}
            </div>
        </div>
    )
}

