import { useSearchParams } from '@remix-run/react'
import type { FC } from 'react'
import {
  BsChevronLeft as PreviousIcon,
  BsChevronRight as NextIcon,
} from 'react-icons/bs'
import { withQuery } from 'ufo'
import { Item as ItemComponent } from './components/Item'
import { Link as LinkComponent } from './components/Link'
import { List as ListComponent } from './components/List'
import { getPageNumbers } from './utils/get-page-numbers'

export interface RemixPaginationProps {
  /**
   * The total number of items that this component encompasses
   */
  total: number

  /**
   * The number of items that are displayed on one page
   */
  size: number

  /**
   * The query component that indicates the current page, defaults to `page`
   */
  pageQuery?: string

  /**
   * The size of icons. This is passed directly to the underlying `react-icon` component.
   * Defaults to `1em`.
   */
  iconSize?: string | number

  /**
   * The text to use for ellipses. Defaults to `...`
   */
  ellipsesText?: string
}

export const RemixPagination: FC<RemixPaginationProps> = ({
  total,
  pageQuery = 'page',
  size,
  iconSize = '1em',
  ellipsesText,
}) => {
  const [params] = useSearchParams()

  const query = Object.fromEntries(params.entries())

  const currentPage = Number(query[pageQuery] || 1)

  const isLastPage = currentPage * size >= total
  const pageNumbers = getPageNumbers({
    currentPage,
    pageSize: size,
    total,
    ellipsesText,
  })

  const url = (page: string | number) =>
    withQuery('', { ...query, [pageQuery]: page.toString() })

  if (pageNumbers.length === 0) return null

  return (
    <nav className={'remix-pagination__container'} aria-label="pagination">
      <ListComponent>
        <ItemComponent>
          {currentPage !== 1 ? (
            <LinkComponent
              to={url(currentPage - 1)}
              label="Previous page"
              isIcon
            >
              <PreviousIcon
                size={iconSize}
                className="remix-pagination__icon"
              />
            </LinkComponent>
          ) : (
            <LinkComponent
              to="#"
              label="No previous page available"
              isIcon
              disabled
            >
              <PreviousIcon
                size={iconSize}
                className="remix-pagination__icon"
              />
            </LinkComponent>
          )}
        </ItemComponent>
        {pageNumbers.map((pageNumber, i) =>
          pageNumber === '...' ? (
            <ItemComponent key={`${pageNumber}${i}`} hellip>
              <LinkComponent to="#" disabled label="ellipsis">
                &hellip;
              </LinkComponent>
            </ItemComponent>
          ) : (
            <ItemComponent key={pageNumber}>
              {pageNumber === currentPage ? (
                <LinkComponent
                  to="#"
                  label={`Page ${pageNumber}, current page`}
                  disabled
                  current
                >
                  {pageNumber}
                </LinkComponent>
              ) : (
                <LinkComponent
                  to={url(pageNumber)}
                  label={`Page ${pageNumber}`}
                >
                  {pageNumber}
                </LinkComponent>
              )}
            </ItemComponent>
          ),
        )}
        <ItemComponent>
          {!isLastPage ? (
            <LinkComponent to={url(currentPage + 1)} label="Next page" isIcon>
              <NextIcon size={iconSize} className="remix-pagination__icon" />
            </LinkComponent>
          ) : (
            <LinkComponent
              to="#"
              label="No next page available"
              isIcon
              disabled
            >
              <NextIcon size={iconSize} className="remix-pagination__icon" />
            </LinkComponent>
          )}
        </ItemComponent>
      </ListComponent>
    </nav>
  )
}

export default RemixPagination
