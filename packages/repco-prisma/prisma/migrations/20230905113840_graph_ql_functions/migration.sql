CREATE OR REPLACE FUNCTION get_content_groupings_by_language(language_code text)
RETURNS TABLE(uid text, 
			  revisionid text, 
			  broadcastschedule text, 
			  groupingtype text, 
			  startingdate timestamp without time zone, 
			  subtitle text, 
			  terminationDate timestamp without time zone, 
			  variant "ContentGroupingVariant",
			  licenseuid text,
			  description text, 
			  title text, 
			  summary text) 
AS $$
begin
   return query EXECUTE 'select
   	uid, "ContentGrouping"."revisionId", "ContentGrouping"."broadcastSchedule", "ContentGrouping"."groupingType", "ContentGrouping"."startingDate",
	subtitle, "ContentGrouping"."terminationDate", variant, "ContentGrouping"."licenseUid",
	description#>>''{' || language_code ||',value}'' as description,
	title#>>''{' || language_code ||',value}'' as title,
	summary#>>''{' || language_code ||',value}'' as summary
	from
	"ContentGrouping"
	where title->>'|| quote_literal(language_code) ||' is not null
	or description->>'|| quote_literal(language_code) ||' is not null
	or summary->>'|| quote_literal(language_code) ||' is not null'
     using language_code;
end; 
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_content_items_by_language(language_code text)
RETURNS TABLE(uid text, 
			  revisionid text, 
			  subtitle text, 
			  pubdate timestamp without time zone, 
			  contentformat text, 
			  primarygroupinguid text, 
			  licenseuid text, 
			  publicationserviceuid text, 
			  title text, 
			  content text, 
			  summary text) 
AS $$
begin
   return query EXECUTE 'select
   	uid, "ContentItem"."revisionId", subtitle, "ContentItem"."pubDate", "ContentItem"."contentFormat", 
	"ContentItem"."primaryGroupingUid", "ContentItem"."licenseUid","ContentItem"."publicationServiceUid",
	title#>>''{' || language_code ||',value}'' as title,
	content#>>''{' || language_code ||',value}'' as content,
	summary#>>''{' || language_code ||',value}'' as summary
	from
	"ContentItem"
	where title->>'|| quote_literal(language_code) ||' is not null
	or content->>'|| quote_literal(language_code) ||' is not null
	or summary->>'|| quote_literal(language_code) ||' is not null'
     using language_code;
end; 
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_media_asset_by_language(language_code text)
RETURNS TABLE(uid text, 
			  revisionid text, 
			  duration float, 
			  mediatype text, 
			  fileuid text, 
			  teaserimageuid text, 
			  licenseuid text, 
			  title text, 
			  description text) 
AS $$
begin
   return query EXECUTE 'select
   	uid, "MediaAsset"."revisionId", duration, "MediaAsset"."mediaType", "MediaAsset"."fileUid", 
	"MediaAsset"."teaserImageUid", "MediaAsset"."licenseUid",
	title#>>''{' || language_code ||',value}'' as title,
	description#>>''{' || language_code ||',value}'' as description
	from
	"MediaAsset"
	where title->>'|| quote_literal(language_code) ||' is not null
	or description->>'|| quote_literal(language_code) ||' is not null'
     using language_code;
end; 
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_chapter_by_language(language_code text)
RETURNS TABLE(uid text, 
			  revisionid text, 
			  start float, 
			  duration float, 
			  type text,  
			  title text) 
AS $$
begin
   return query EXECUTE 'select
   	uid, "Chapter"."revisionId", start, duration, type,
	title#>>''{' || language_code ||',value}'' as title
	from
	"Chapter"
	where title->>'|| quote_literal(language_code) ||' is not null'
     using language_code;
end; 
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_publication_service_by_language(language_code text)
RETURNS TABLE(uid text, 
			  revisionid text, 
			  medium text, 
			  address text, 
			  publisheruid text,  
			  title text) 
AS $$
begin
   return query EXECUTE 'select
   	uid, "PublicationService"."revisionId", medium, address, "PublicationService"."publisherUid",
	name#>>''{' || language_code ||',value}'' as name
	from
	"PublicationService"
	where name->>'|| quote_literal(language_code) ||' is not null'
     using language_code;
end; 
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_concept_by_language(language_code text)
RETURNS TABLE(uid text, 
			  revisionid text, 
			  originnamespace text, 
			  wikidataidentifier text, 
			  sameasuid text,  
			  parentuid text,
			  kind "ConceptKind",
			  name text,
			  summary text,
			  description text) 
AS $$
begin
   return query EXECUTE 'select
   	uid, "Concept"."revisionId", "PublicationService"."originNamespace", "PublicationService"."wikidataIdentifier",
	"PublicationService"."sameAsUid", "PublicationService"."parentUid", kind,
	name#>>''{' || language_code ||',value}'' as name,
	summary#>>''{' || language_code ||',value}'' as summary,
	description#>>''{' || language_code ||',value}'' as description
	from
	"Concept"
	where name->>'|| quote_literal(language_code) ||' is not null
	or summary->>'|| quote_literal(language_code) ||' is not null
	or description->>'|| quote_literal(language_code) ||' is not null'
     using language_code;
end; 
$$ LANGUAGE plpgsql;