// components/Editor.tsx

"use client"

import styles from './editor.module.css'
import { useRef, useEffect, useState, type KeyboardEvent, type DragEvent } from "react"

interface Block {
    id: string
    content: string
}

export default function Editor() {

    const [blocks, setBlocks] = useState<Block[]>([{ id: "1", content: "" }]) //Block[] means: [Block, Block, Block, ...]
    const [focusedBlockId, setFocusedBlockId] = useState<string>("1")
    const blockRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
    const [draggedId, setDraggedId] = useState<string | null>();
    const [draggedOverId, setDraggedOverId] = useState<string | null>();

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>, blockId: string, index: number) => {
        if (e.key === "Enter") {
            e.preventDefault()

            const newBlockId = Date.now().toString();

            setBlocks((prevBlocks) => {
                const newBlocks = [...prevBlocks]
                newBlocks.splice(index + 1, 0, {
                    id: newBlockId,
                    content: ""
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

        } else if (e.key === "ArrowUp") {
            const previousBlock = blocks.find((block) => block.id === blocks[index - 1]?.id)
            if (previousBlock) setFocusedBlockId(previousBlock.id)
        } else if (e.key === "ArrowDown") {
            const nextBlock = blocks.find((block) => block.id === blocks[index + 1]?.id)
            if (nextBlock) setFocusedBlockId(nextBlock.id)
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
    }

    const handleDragStart = (e: DragEvent<HTMLDivElement>, blockId: string) => {
        setDraggedId(blockId);
        e.dataTransfer.effectAllowed = "move" // Tells the browser what kind of drag operation is allowed.
        e.dataTransfer.setData("text/plain", blockId)
        // Stores some data inside the drag event, which will be available later in onDrop."text/plain" is the data type. blockId is the data content.
    }
    const handleDragOver = (e: DragEvent<HTMLDivElement>, blockId: string) => {
        e.preventDefault() //Necessary to allow drop
        if (draggedId !== blockId) setDraggedOverId(blockId)
    }

    const handleDrop = (e: DragEvent<HTMLDivElement>, dropTargetId: string) => {
        e.preventDefault()
        if (!draggedId || draggedId === dropTargetId) {
            setDraggedId(null)
            setDraggedOverId(null)
            return
        }

        setBlocks((prevBlocks) => {
            const newBlocks = [...prevBlocks]
            const draggedIndex = newBlocks.findIndex((block) => block.id === draggedId)
            const dropTargetIndex = newBlocks.findIndex((block) => block.id === dropTargetId)

            if(draggedIndex === -1 || dropTargetIndex === -1){
                return prevBlocks
            }

            const [removed] = newBlocks.splice(draggedIndex, 1)
            newBlocks.splice(dropTargetIndex, 0 , removed)

            return newBlocks
        })

        setFocusedBlockId(draggedId)
        setDraggedId(null)
        setDraggedOverId(null)
    }

    const handleDragEnd = () => {
        setDraggedId(null)
        setDraggedOverId(null)
    }

    useEffect(() => {
        if (focusedBlockId && blockRefs.current[focusedBlockId]) {
            const element = blockRefs.current[focusedBlockId]
            element?.focus()

            const range = document.createRange() // Okay browser, I’m ready to mark some text — but I haven’t selected anything yet.
            const selection = window.getSelection() // tells where the cursor is or what text is selected by the user on the page right now

            if (element && selection) {
                range.selectNodeContents(element) // Selects (highlights) all content inside the given element
                range.collapse(false) // Places the cursor at the end of the selected content.
                selection.removeAllRanges() // Removes the selection highlight 
                selection.addRange(range) // Actually show the new cursor/ to tell when to actually apply that range and call the cursor at that desired position
            }
        }
    }, [focusedBlockId])

    return (
        <div className={styles.container}>
            <div className={styles.blockList}>
                {blocks.map((block, index) => (
                    <div key={block.id}
                        ref={(el) => { blockRefs.current[block.id] = el }}
                        contentEditable
                        suppressContentEditableWarning={true}
                        className={[
                            styles.block,
                            draggedId === block.id ? styles.dragging : "",
                            draggedOverId === block.id ? styles.dragOver : ""
                        ].filter(Boolean).join(" ")}

                        data-placeholder={placeHolderText(index, block.id)}
                        onKeyDown={(e) => handleKeyDown(e, block.id, index)}
                        onInput={(e) => handleInput(e, block.id)}
                        onFocus={() => setFocusedBlockId(block.id)}
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, block.id)}
                        onDragOver={(e) => handleDragOver(e, block.id)}
                        onDrop={(e) => handleDrop(e, block.id)}
                        onDragEnd={handleDragEnd}
                    >
                    </div>
                ))}
            </div>
        </div>
    )
}