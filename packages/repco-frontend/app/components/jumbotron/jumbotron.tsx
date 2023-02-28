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
        <div className="bg-white rounded-md shadow-md p-6 relative">
          <IconButton
            title="Close"
            aria-label="Close"
            className="absolute top-0 right-0 m-3 border-none bg-transparent cursor-pointer"
            onClick={handleClose}
          >
            <CloseIcon />
          </IconButton>
          <h1 className="text-2xl font-bold mb-2">{title}</h1>
          <p className="text-gray-600">{message}</p>
        </div>
      )}
    </>
  )
}
