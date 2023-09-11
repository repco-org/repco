//typescript types for the cba datasource

export interface OutBox {
    id: number
    type: string
    totalItems: number
    first: string
}

// const outBox = zod.object({
//     id: zod.string(),
//     type: zod.string(),
//     totalItems: zod.number(),
//     first: zod.string(),
//   })
//   type OutBox = zod.infer<typeof outBox>
  
  const activity = zod.object({
    type: zod.string(),
    id: zod.string(),
    actor: zod.string(),
    object: zod.string(),
    to: zod.string().array(),
    cc: zod.string().array(),
  })
  type Activity = zod.infer<typeof activity>
  
  const page = zod.object({
    id: zod.string(),
    type: zod.string(),
    next: zod.string().optional(),
    partOf: zod.string(),
    orderedItems: activity.array(),
    totalitems: zod.number(),
  })
  type Page = zod.infer<typeof page>
  
  const activityHashTagObject = zod.object({
    type: zod.literal("Hashtag"),
    href: zod.string().optional(),
    name: zod.string(),
  })
  type ActivityHashTagObject = zod.infer<typeof activityHashTagObject>
  
  const activityIdentifierObject = zod.object({
    identifier: zod.string(),
    name: zod.string(),
    url: zod.string().optional(),
  })
  type ActivityIdentifierObject = zod.infer<typeof activityIdentifierObject>
  
  const activityIconObject = zod.object({
    type: zod.literal('Image'),
    url: zod.string(),
    mediaType: zod.string(),
    width: zod.number().optional(),
    height: zod.number().optional(),
  })
  type activityIconObject = zod.infer<typeof activityIconObject>
  
  const activityVideoUrlObject = zod.object({
    type: zod.literal('Link'),
    mediaType: zod.enum(['video/mp4', 'video/webm', 'video/ogg']),
    href: zod.string(),
    height: zod.number(),
    size: zod.number(),
    fps: zod.number(),
  })
  type ActivityVideoUrlObject = zod.infer<typeof activityVideoUrlObject>
  
  const activityHtmlUrlObject = zod.object({
    type: zod.literal('Link'),
    mediaType: zod.literal('text/html'),
    href: zod.string(),
  })
  type ActivityHtmlUrlObject = zod.infer<typeof activityHtmlUrlObject>
  
  const activityVideoFileMetadataUrlObject = zod.object({
    type: zod.literal('Link'),
    rel: zod.string().array(),
    mediaType: zod.literal('application/json'),
    height: zod.number(),
    href: zod.string(),
    fps: zod.number(),
  })
  type ActivityVideoFileMetadataUrlObject = zod.infer<typeof activityVideoFileMetadataUrlObject>
  
  const activityUrlObject = zod.union([activityVideoUrlObject, activityHtmlUrlObject, activityVideoFileMetadataUrlObject])
  type ActivityUrlObject = zod.infer<typeof activityUrlObject>
  
  const activityPubAttributedTo = zod.union([
    zod.string(), 
    zod.object({
        type: zod.enum(['Group', 'Person']),
        id: zod.string()
    })
  ])
  type ActivityPubAttributedTo = zod.infer<typeof activityPubAttributedTo>
  
  // TODO: actually some videoObjects don't have categories. what else could be missing?
  const videoObject = zod.object({
    type: zod.string(),
    id: zod.string(),
    name: zod.string(),
    duration: zod.string(),
    uuid: zod.string(),
    tag: activityHashTagObject.array(),
    category: activityIdentifierObject.optional(),
    licence: activityIdentifierObject.optional(),
    language: activityIdentifierObject.optional(),
    subtitleLanguage: activityIdentifierObject.array(),
    views: zod.number(),
    sensitive: zod.boolean(),
    published: zod.string().datetime(),
    originallyPublishedAt: zod.string().nullable().optional(),
    updated: zod.string().datetime(),
    uploadDate: zod.string(),
    mediaType: zod.literal('text/markdown'),
    content: zod.string(),
    support: zod.string(),
    icon: activityIconObject.array(),
    url: activityUrlObject.array(),
    attributedTo: activityPubAttributedTo.array(),
  })
  type VideoObject = zod.infer<typeof videoObject>
  
  type Cursor = {
    lastPublishedDate: Date
  }