#!/bin/bash
echo "Configuring repco repos and datasources"

echo "creating aracityradio repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create aracityradio
echo "adding Ara City Radio ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r aracityradio repco:datasource:rss '{"endpoint":"https://feeds.soundcloud.com/users/soundcloud:users:2162577/sounds.rss", "url":"https://aracityradio.com","name":"Radio ARA","image":"https://images.squarespace-cdn.com/content/v1/5a615d2aaeb62560d14ef42a/9342bcf2-34fa-47f2-a6fe-1a9751d10494/aracity+copy.png?format=1500w","thumbnail":"https://images.squarespace-cdn.com/content/v1/5a615d2aaeb62560d14ef42a/9342bcf2-34fa-47f2-a6fe-1a9751d10494/aracity+copy.png?format=150w"}'

echo "creating civiltavasz repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create civiltavasz
echo "adding Radio Civil Tavasz ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r civiltavasz repco:datasource:rss '{"endpoint":"https://civiltavasz.hu/feed/", "url":"https://civiltavasz.hu","name":"Radio Civil Tavasz","image":"https://civiltavasz.hu/wp-content/uploads/2015/09/civil-logo.png","thumbnail":"https://civiltavasz.hu/wp-content/uploads/2015/09/civil-logo.png"}'

echo "creating eucast repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create eucast
echo "adding eucast ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r eucast repco:datasource:rss '{"endpoint":"https://anchor.fm/s/f3d38ea4/podcast/rss", "url":"Eucast.rs","name":"Eucast.rs","image":"https://eucast.rs/wp-content/uploads/2024/04/eucast-logo-t2.png","thumbnail":"https://eucast.rs/wp-content/uploads/2024/04/eucast-logo-t2.png"}'

echo "creating city-rights-radio repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create city-rights-radio
echo "adding City Rights Radio ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r city-rights-radio repco:datasource:rss '{"endpoint":"https://anchor.fm/s/64ede338/podcast/rss", "url":"https://anchor.fm/s/64ede338/podcast/rss","name":"City Rights Radio","image":"https://d3t3ozftmdmh3i.cloudfront.net/production/podcast_uploaded_nologo/16833118/16833118-1644853804086-100abd1b5a479.jpg","thumbnail":"https://d3t3ozftmdmh3i.cloudfront.net/production/podcast_uploaded_nologo/16833118/16833118-1644853804086-100abd1b5a479.jpg"}'

echo "creating lazy-women repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create lazy-women
echo "adding Lazy Women ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r lazy-women repco:datasource:rss '{"endpoint":"https://anchor.fm/s/d731801c/podcast/rss", "url":"https://lazywomen.com/","name":"Lazy Women","image":"https://d3t3ozftmdmh3i.cloudfront.net/production/podcast_uploaded_nologo/36003455/36003455-1671734955726-771ed95b1f97.jpg","thumbnail":"https://d3t3ozftmdmh3i.cloudfront.net/production/podcast_uploaded_nologo/36003455/36003455-1671734955726-771ed95b1f97.jpg"}'

echo "creating eurozine repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create eurozine
echo "adding Eurozine ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r eurozine repco:datasource:transposer '{"endpoint":"https://vmwczww5w2j.c.updraftclone.com/wp-json/transposer/v1/repco", "url":"https://www.eurozine.com/","name":"Eurozine","image":"https://cba.media/wp-content/uploads/7/7/0000666177/eurozine-logo.png","thumbnail":"https://cba.media/wp-content/uploads/7/7/0000666177/eurozine-logo.png"}'

#echo "creating voxeurop repo..."
#docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create voxeurop
#echo "adding Voxeurop ds..."
#docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r voxeurop repco:datasource:transposer '{"endpoint":"https://dev.voxeurop.eu/wp-json/transposer/v1/repco", "url":"https://voxeurop.eu","name":"Voxeurop","image":"https://upload.wikimedia.org/wikipedia/en/1/1a/Logo_Voxeurop_%282020%29.jpg","thumbnail":"https://upload.wikimedia.org/wikipedia/en/1/1a/Logo_Voxeurop_%282020%29.jpg"}'

echo "creating krytyka-polityczna repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create krytyka-polityczna
echo "adding Krytyka Polityczna ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r krytyka-polityczna repco:datasource:transposer '{"endpoint":"https://beta.krytykapolityczna.pl/wp-json/transposer/v1/repco", "url":"https://krytykapolityczna.pl","name":"Krytyka Polityczna","image":"https://cba.media/wp-content/uploads/8/1/0000667618/logo-krytyka-polityczna.jpg","thumbnail":"https://cba.media/wp-content/uploads/8/1/0000667618/logo-krytyka-polityczna.jpg"}'

echo "creating displayeurope repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create displayeurope
echo "adding Displayeurope.eu ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r displayeurope repco:datasource:transposer '{"endpoint":"https://displayeurope.eu/wp-json/transposer/v1/repco", "url":"https://displayeurope.eu","name":"Displayeurope.eu","image":"https://cba.media/wp-content/uploads/5/4/0000660645/displayeurope-logo.png","thumbnail":"https://cba.media/wp-content/uploads/5/4/0000660645/displayeurope-logo-76x60.png"}'

echo "creating eldiario repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create eldiario
echo "adding ElDiario ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r eldiario repco:datasource:rss '{"endpoint":"https://www.eldiario.es/rss/category/tag/1048911", "url":"https://www.eldiario.es/","name":"ElDiario","image":"https://www.eldiario.es/assets/img/svg/logos/eldiario-tagline-2c.h-129fb361f1eeeaf4af9b8135dc8199ea.svg","thumbnail":"https://www.eldiario.es/assets/img/svg/logos/eldiario-tagline-2c.h-129fb361f1eeeaf4af9b8135dc8199ea.svg"}'

echo "creating ecf repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create ecf
echo "adding ECF European Pavillion podcast ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r ecf repco:datasource:rss '{"endpoint":"https://feeds.acast.com/public/shows/60b002e393a31900125b8e4e", "url":"https://feeds.acast.com/public/shows/60b002e393a31900125b8e4e","name":"ECF European Pavillion podcast","image":"https://assets.pippa.io/shows/60b002e393a31900125b8e4e/show-cover.jpeg","thumbnail":"https://assets.pippa.io/shows/60b002e393a31900125b8e4e/show-cover.jpeg"}'

echo "creating amensagem repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create amensagem
echo "adding Mensagem de Lisboa ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r amensagem repco:datasource:rss '{"endpoint":"https://amensagem.pt/feed", "url":"https://amensagem.pt","name":"Mensagem de Lisboa","image":"https://i0.wp.com/amensagem.pt/wp-content/uploads/2021/01/cropped-cropped-a-mensagem-logo-scaled-1.jpg?w=2560&ssl=1","thumbnail":"https://i0.wp.com/amensagem.pt/wp-content/uploads/2021/01/cropped-cropped-a-mensagem-logo-scaled-1.jpg?w=2560&ssl=1"}'

echo "creating migrant-women repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create migrant-women
echo "adding Migrant Women Press ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r migrant-women repco:datasource:rss '{"endpoint":"https://migrantwomenpress.com/feed/", "url":"https://migrantwomenpress.com/","name":"Migrant Women Press","image":"https://migrantwomenpress.com/wp-content/uploads/2024/04/cropped-cropped-Lockup-Color.png","thumbnail":"https://migrantwomenpress.com/wp-content/uploads/2024/04/cropped-cropped-Lockup-Color.png"}'

echo "creating sudvest repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create sudvest
echo "adding Sudvest ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r sudvest repco:datasource:rss '{"endpoint":"https://sudvest.ro/feed/", "url":"https://sudvest.ro","name":"Sudvest","image":"https://sudvest.ro/wp-content/uploads/2020/02/SUDVEST.jpg","thumbnail":"https://sudvest.ro/wp-content/uploads/2020/02/SUDVEST.jpg"}'

echo "creating vreme repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create vreme
echo "adding Vreme ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r vreme repco:datasource:rss '{"endpoint":"https://anchor.fm/s/f124f260/podcast/rss", "url":"https://www.vreme.com/","name":"Vreme","image":"https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_nologo/40357304/40357304-1705940540363-c0d9589726ecf.jpg","thumbnail":"https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_nologo/40357304/40357304-1705940540363-c0d9589726ecf.jpg"}'

echo "creating cins repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create cins
echo "adding cins ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r cins repco:datasource:rss '{"endpoint":"https://anchor.fm/s/e8747e38/podcast/rss", "url":"https://www.cins.rs/en/","name":"Center for Investigative Journalism Serbia","image":"https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_nologo/38899486/38899486-1693856314696-a8d5a7cbd3557.jpg","thumbnail":"https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_nologo/38899486/38899486-1693856314696-a8d5a7cbd3557.jpg"}'

echo "creating sound-of-thought repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create sound-of-thought
echo "adding Sound of Thought (Institute for Philosophy and social theory) ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r sound-of-thought repco:datasource:rss '{"endpoint":"https://anchor.fm/s/d9850604/podcast/rss", "url":"https://ifdt.bg.ac.rs/?lang=en","name":"Sound of Thought (Institute for Philosophy and social theory)","image":"https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_nologo/36393737/36393737-1686347856464-23acb9a41f5fd.jpg","thumbnail":"https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_nologo/36393737/36393737-1686347856464-23acb9a41f5fd.jpg"}'

echo "creating klima-101 repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create klima-101
echo "adding Klima 101 ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r klima-101 repco:datasource:rss '{"endpoint":"https://anchor.fm/s/da0dc82c/podcast/rss", "url":"https://klima101.rs/","name":"Klima 101","image":"https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_nologo/36483363/0867d5a20d2805b0.jpeg","thumbnail":"https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_nologo/36483363/0867d5a20d2805b0.jpeg"}'

echo "creating mdi repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create mdi
echo "adding MDI Institute ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r mdi repco:datasource:rss '{"endpoint":"https://anchor.fm/s/15af2750/podcast/rss", "url":"https://www.media-diversity.org/","name":"Klima 101","image":"https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_nologo/3538004/3538004-1714411872178-764483c4e8899.jpg","thumbnail":"https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_nologo/3538004/3538004-1714411872178-764483c4e8899.jpg"}'

echo "creating norwegiannewcomers repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create norwegiannewcomers
echo "adding Norwegian Newcomers ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r norwegiannewcomers repco:datasource:rss '{"endpoint":"https://feed.podbean.com/norwegiannewcomers/feed.xml", "url":"https://www.norwegiannewcomers.com/","name":"Norwegian Newcomers","image":"https://pbcdn1.podbean.com/imglogo/image-logo/10126232/NoNewlogo.png","thumbnail":"https://pbcdn1.podbean.com/imglogo/image-logo/10126232/NoNewlogo.png"}'

echo "creating europeanspodcast repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create europeanspodcast
echo "adding The Europeans podcast ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r europeanspodcast repco:datasource:rss '{"endpoint":"https://anchor.fm/s/17af354/podcast/rss", "url":"https://europeanspodcast.com/","name":"The Europeans podcast","image":"https://upload.wikimedia.org/wikipedia/en/c/cd/The_Europeans_podcast.jpg","thumbnail":"https://upload.wikimedia.org/wikipedia/en/c/cd/The_Europeans_podcast.jpg"}'

#echo "creating masteringpublicspace repo..."
#docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create masteringpublicspace
#echo "adding masteringpublicspace ds..."
#docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r masteringpublicspace repco:datasource:rss '{"endpoint":"https://www.masteringpublicspace.org/rss", "url":"https://www.cityspacearchitecture.org/","name":"CITY SPACE ARCHITECTURE","image":"https://www.cityspacearchitecture.org/images/2018-09/logo_portal.jpg","thumbnail":"https://www.cityspacearchitecture.org/images/2018-09/logo_portal.jpg"}'

echo "creating arainfo repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create arainfo
echo "adding AraInfo ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r arainfo repco:datasource:rss '{"endpoint":"https://arainfo.org/feed/", "url":"https://arainfo.org/","name":"AraInfo","image":"https://arainfo.org/wordpress/wp-content/uploads/2019/03/arainfo.svg","thumbnail":"https://arainfo.org/wordpress/wp-content/uploads/2019/03/arainfo.svg"}'

echo "creating enfoque repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create enfoque
echo "adding Enfoque ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r enfoque repco:datasource:rss '{"endpoint":"https://enfoquezamora.com/feed/", "url":"https://enfoquezamora.com/","name":"Enfoque","image":"https://enfoquezamora.com/wp-content/uploads/2023/11/2400x1200_enfoque_logo-2.png","thumbnail":"https://enfoquezamora.com/wp-content/uploads/2023/11/2400x1200_enfoque_logo-2.png"}'

echo "creating naratorium repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create naratorium
echo "adding Naratorium ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r naratorium repco:datasource:rss '{"endpoint":"https://naratorium.ba/feed", "url":"https://naratorium.ba/","name":"Naratorium","image":"https://naratorium.ba/wp-content/uploads/2022/01/naratorium-logo.png","thumbnail":"https://naratorium.ba/wp-content/uploads/2022/01/naratorium-logo.png"}'

echo "creating new-eastern-europe repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create new-eastern-europe
echo "adding New Eastern Europe ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r new-eastern-europe repco:datasource:rss '{"endpoint":"https://www.spreaker.com/show/4065065/episodes/feed", "url":"https://neweasterneurope.eu/","name":"New Eastern Europe","image":"https://neweasterneurope.eu/wp-content/uploads/2023/04/logo-nee-web-3.png","thumbnail":"https://neweasterneurope.eu/wp-content/uploads/2023/04/logo-nee-web-3.png"}'

# echo "creating beeldengeluid repo..."
# docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create beeldengeluid
# echo "adding Beeld & Geluid ds..."
# docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r beeldengeluid repco:datasource:activitypub '{"user":"openbeelden", "domain":"peertube.beeldengeluid.nl", "url":"https://beeldengeluid.nl","name":"Beeld & Geluid","image":"https://cba.media/wp-content/uploads/6/7/0000666176/logo-beeldengeluid.png","thumbnail":"https://cba.media/wp-content/uploads/6/7/0000666176/logo-beeldengeluid.png"}'

echo "creating frn repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create frn
echo "adding Freie-radios.net ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r frn repco:datasource:rss '{"endpoint":"https://www.freie-radios.net/portal/podcast.php?rss", "url":"http://freie-radios.net/","name":"Freie-radios.net","image":"https://cba.media/wp-content/uploads/7/4/0000667547/frn-logo.png","thumbnail":"https://cba.media/wp-content/uploads/7/4/0000667547/frn-logo.png"}'

echo "creating okto repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create okto
echo "adding Okto TV ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r okto repco:datasource:rss '{"endpoint":"https://www.okto.tv/de/display-europe.rss", "url":"https://www.okto.tv/","name":"Okto TV","image":"https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Okto.svg/800px-Okto.svg.png","thumbnail":"https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Okto.svg/293px-Okto.svg.png"}'

docker restart repco-app