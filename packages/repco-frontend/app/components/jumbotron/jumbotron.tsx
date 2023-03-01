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
        <div
          className="bg-white rounded-md shadow-md p-4 sm:p-6 relative hover:shadow-xl"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <IconButton
            title="Close"
            aria-label="Close"
            className="absolute top-0 right-0 m-2 sm:m-3 border-none bg-transparent cursor-pointer"
            onClick={handleClose}
          >
            <CloseIcon />
          </IconButton>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-4">
            {title}
          </h2>
          <p className="text-lg sm:text-xl text-gray-600">{message}</p>
        </div>
      )}
    </>
  )
}
