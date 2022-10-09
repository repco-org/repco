import { Box, Flex, Text } from '@chakra-ui/react'
import { Link, useSearchParams } from '@remix-run/react'
import { Select } from 'chakra-react-select'
import { useEffect, useState } from 'react'

interface parseNumberParams {
  value: string | null
  defaultValue: number
}
const parseNumber = ({ value, defaultValue }: parseNumberParams) => {
  return typeof value === 'string' ? parseInt(value) : defaultValue
}

export const usePagination = ({ count }: { count: number }) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentTake = parseNumber({
    value: searchParams.get('take'),
    defaultValue: 20,
  })
  const currentPage = parseNumber({
    value: searchParams.get('page'),
    defaultValue: 1,
  })
  const [page, setPage] = useState(currentPage)
  const [take, setTake] = useState(currentTake)
  const [numberOfPages, setNumberOfPages] = useState(Math.ceil(count / take))

  useEffect(() => {
    setNumberOfPages(Math.ceil(count / take))
  }, [count, take])
  useEffect(() => {
    setPage(currentPage)
  }, [currentPage])
  useEffect(() => {
    setTake(currentTake)
  }, [currentTake])
  useEffect(() => {
    setSearchParams({ take: take.toString(), page: page.toString() })
  }, [take, page])
  return { page, take, numberOfPages, setPage, setTake }
}

export const usePaginationLoader = async ({
  searchParams,
  clientFunction,
}: {
  searchParams: URLSearchParams
  clientFunction: Function
}) => {
  const page = parseInt(searchParams.get('page') || '1')
  const take = parseInt(searchParams.get('take') || '20')
  const skip = (page - 1) * take
  const orderBy = searchParams.get('orderBy') || {
    startDate: 'asc',
  }
  const where = {
    startDate: {
      gte: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
    },
  }
  const [count, items] = await clientFunction({ take, skip, orderBy, where })
  const numberOfPages = Math.ceil(count / take)
  return { count, items, numberOfPages }
}

export const Pagination = ({
  numberOfPages,
  page,
  take,
  setPage,
  setTake,
  loaderPath = '',
}: {
  numberOfPages: number
  take: number
  page: number
  setPage: React.Dispatch<React.SetStateAction<number>>
  setTake: React.Dispatch<React.SetStateAction<number>>
  loaderPath?: string
}) => {
  if (page < 1) {
    setPage(1)
  }
  if (page > numberOfPages) {
    setPage(numberOfPages)
  }
  const pageArray = (numberOfPages: number, page: number) => {
    if (numberOfPages <= 7) {
      return [...Array(numberOfPages)].map((_, i) => i + 1)
    }
    if (numberOfPages > 7 && page < 5) {
      return [1, 2, 3, 4, 5, '...', numberOfPages]
    }
    if (numberOfPages > 7 && page > numberOfPages - 4) {
      return [
        1,
        '...',
        numberOfPages - 4,
        numberOfPages - 3,
        numberOfPages - 2,
        numberOfPages - 1,
        numberOfPages,
      ]
    }
    if (numberOfPages > 7 && page >= 5 && page <= numberOfPages - 4) {
      return [1, '...', page - 1, page, page + 1, '...', numberOfPages]
    }
    return []
  }
  return (
    <Box>
      <Flex justify="space-between" alignItems={'center'} gap={4}>
        <Flex gap={2} alignItems="center">
          <label htmlFor="take">Show</label>
          <Select
            id="take"
            size="sm"
            name="take"
            onChange={(e: any) => {
              setTake(e?.value as number)
            }}
            defaultValue={{ value: take, label: take.toString() }}
            options={[
              { value: 10, label: '10' },
              { value: 20, label: '20' },
              { value: 50, label: '50' },
            ]}
          />
        </Flex>

        <Flex gap={2}>
          {pageArray(numberOfPages, page).map((el, index) => {
            if (typeof el === 'string') {
              return <Text key={index}>{el}</Text>
            }
            return (
              <Link
                key={index}
                style={page === el ? { color: 'red' } : {}}
                to={`?page=${el}`}
                onClick={() => {
                  setPage(el)
                }}
              >
                {el}
              </Link>
            )
          })}
        </Flex>
        <Text>{`Page ${page} from ${numberOfPages} `}</Text>
      </Flex>
    </Box>
  )
}
