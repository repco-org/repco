import React, { useState } from 'react'
import { CloseIcon } from '../icons'
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
        <div className="relative bg-gradient-to-r from-brand-primary to-brand-secondary rounded-md shadow-md h-52 p-4 text-white text-center flex flex-col items-center justify-center">
          <IconButton
            title="Close"
            aria-label="Close"
            className="p-3 absolute top-0 right-0 border-none bg-transparent cursor-pointer"
            onClick={handleClose}
          >
            <CloseIcon />
          </IconButton>
          <h1 className="text-3xl font-bold mb-4">{title}</h1>
          <p className="w-3/4 text-center">{message}</p>
        </div>
      )}
    </>
  )
}
