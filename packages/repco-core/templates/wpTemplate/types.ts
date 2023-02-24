// this is the type of the data that will be returned from the datasource
// and just an example typically this would be a json object for a Wordpress
// datasource Api

export interface yourDatasourcePost {
  id: number
  date: Date
  date_gmt: Date
  guid: string
  modified: Date
  modified_gmt: Date
  slug: string
  link: string
  title: string
  content: string
  category: number[]
  tag: number[]
  series: number[]
}
