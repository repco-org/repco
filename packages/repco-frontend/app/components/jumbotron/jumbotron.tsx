import React, { useState } from 'react'
import { IconButton } from '../primitives/button'

interface ClosableJumbotronProps {
  title: string
  message: string
}

export default function ClosableJumbotron({
  title,
  message,
}: ClosableJumbotronProps) {
  const [show, setShow] = useState(true)

  const handleClose = () => setShow(false)

  return (
    <>
      {show && (
        <div className="h-52 p-4 text-white text-xl flex flex-col items-center justify-center relative bg-gradient-to-l from-brand-primary to-brand-secondary">
          <IconButton
            className="p-3 absolute top-0 right-0 border-none bg-transparent cursor-pointer"
            onClick={handleClose}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              width="16"
              height="16"
            >
              <rect
                x="0.5"
                y="0.5"
                width="15"
                height="15"
                fill="none"
                stroke="#000"
              />
              <line
                x1="4"
                y1="4"
                x2="12"
                y2="12"
                stroke="#000"
                strokeWidth="1.5"
              />
              <line
                x1="12"
                y1="4"
                x2="4"
                y2="12"
                stroke="#000"
                strokeWidth="1.5"
              />
            </svg>
          </IconButton>
          <h1 className="font-bold text-3xl text-center mb-4">{title}</h1>
          <p className="w-3/4 text-center">{message}</p>
        </div>
      )}
    </>
  )
}
