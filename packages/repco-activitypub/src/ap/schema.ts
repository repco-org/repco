import * as zod from 'zod'

export const object = zod
  .object({
    id: zod.string(),
    attributedTo: zod
      .array(zod.object({ id: zod.string(), type: zod.string() }))
      .optional(),
  })
  .passthrough()

export type Object = zod.infer<typeof object>

export const objectOrId = zod.union([zod.string(), object])

export type ObjectOrId = zod.infer<typeof objectOrId>

export const actor = zod
  .object({
    id: zod.string(),
    type: zod.string(),
    inbox: zod.string().optional(),
    sharedInbox: zod.string().optional(),
  })
  .passthrough()

export type Actor = zod.infer<typeof actor>

export const activity = zod
  .object({
    actor: zod.string(),
    id: zod.string(),
    type: zod.string(),
    object: objectOrId,
  })
  .passthrough()

export type Activity = zod.infer<typeof activity>

export const webfinger = zod.object({
  links: zod.array(
    zod
      .object({ rel: zod.string(), href: zod.string().optional() })
      .passthrough(),
  ),
})

export type Webfinger = zod.infer<typeof webfinger>

export const createLocalActor = zod.object({
  name: zod.string().regex(/^[a-zA-Z]{1}[a-zA-Z0-9-]+$/),
})

export type CreateLocalActor = zod.infer<typeof createLocalActor>
