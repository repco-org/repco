import type { MediaAsset } from '~/graphql/types'
import { FileWidget } from './file-widget'

interface MediaDisplayProps {
  mediaAssets: MediaAsset[]
  contentItemUid: string
}

export function MediaDisplayTable({
  mediaAssets,
  contentItemUid,
}: MediaDisplayProps) {
  return (
    <div className="flex flex-col">
      <div className="py-2 inline-block min-w-full ">
        <div className="overflow-hidden">
          <table className="table-fixed w-full">
            <thead className="border-b">
              <tr>
                <th
                  scope="col"
                  className="text-sm font-medium text-gray-900 py-4 text-left"
                >
                  #
                </th>
                <th
                  scope="col"
                  className="text-sm font-medium text-gray-900 py-4 text-left"
                >
                  MediaType
                </th>
                <th
                  scope="col"
                  className="text-sm font-medium text-gray-900  py-4 text-left"
                >
                  Title
                </th>
                <th
                  scope="col"
                  className="text-sm font-medium text-gray-900  py-4 text-left"
                >
                  FileWidgets
                </th>
              </tr>
            </thead>
            <tbody>
              {mediaAssets.map((mediaAsset, i) => (
                <tr key={i} className="bg-white border-b">
                  <td>{i + 1}</td>
                  <td>{mediaAsset.mediaType}</td>
                  <td>{mediaAsset.title}</td>
                  <td>
                    <FileWidget
                      mediaAsset={mediaAsset}
                      contentItemUid={contentItemUid}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
