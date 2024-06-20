#!/bin/bash
echo "Configuring repco repos and datasources"

echo "creating orange repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create orange
echo "adding Orange 94,0 ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r orange repco:datasource:cba '{"endpoint":"https://cba.media/wp-json/wp/v2", "stationId":262317, "url":"https://cba.media","name":"Orange 94,0","image":"https://cba.media/wp-content/uploads/7/0/0000474207/orange.gif","thumbnail":"https://cba.media/wp-content/uploads/7/0/0000474207/orange-360x240.gif"}'

echo "creating fro repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create fro
echo "adding Radio FRO ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r fro repco:datasource:cba '{"endpoint":"https://cba.media/wp-json/wp/v2", "stationId":262315, "url":"https://cba.media","name":"Radio FRO","image":"https://cba.media/wp-content/uploads/3/0/0000348503/fro-logo-w-os.jpg","thumbnail":"https://cba.media/wp-content/uploads/3/0/0000348503/fro-logo-w-os-360x240.jpg"}'

echo "creating radiofabrik repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create radiofabrik
echo "adding Radiofabrik ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r radiofabrik repco:datasource:cba '{"endpoint":"https://cba.media/wp-json/wp/v2", "stationId":262323, "url":"https://cba.media","name":"Radiofabrik","image":"https://cba.media/wp-content/uploads/0/2/0000474220/radiofabrik.gif","thumbnail":"https://cba.media/wp-content/uploads/0/2/0000474220/radiofabrik-360x240.gif"}'

echo "creating proton repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create proton
echo "adding Proton ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r proton repco:datasource:cba '{"endpoint":"https://cba.media/wp-json/wp/v2", "stationId":262342, "url":"https://cba.media","name":"Proton","image":"https://cba.media/wp-content/uploads/8/0/0000474208/proton.gif","thumbnail":"https://cba.media/wp-content/uploads/8/0/0000474208/proton-360x240.gif"}'

echo "creating fri repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create fri
echo "adding Freies Radio Innviertel ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r fri repco:datasource:cba '{"endpoint":"https://cba.media/wp-json/wp/v2", "stationId":580988, "url":"https://cba.media","name":"Freies Radio Innviertel","image":"https://cba.media/wp-content/uploads/4/6/0000608864/fri-freiesradioinnviertel-logo-cmyk.jpg","thumbnail":"https://cba.media/wp-content/uploads/4/6/0000608864/fri-freiesradioinnviertel-logo-cmyk-360x141.jpg"}'

echo "creating mora repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create mora
echo "adding Radio MORA ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r mora repco:datasource:cba '{"endpoint":"https://cba.media/wp-json/wp/v2", "stationId":299489, "url":"https://cba.media","name":"Radio MORA","image":"https://cba.media/wp-content/uploads/2/8/0000632782/logo-radio-mora-untertitel-deutsch-web-rz.png","thumbnail":"https://cba.media/wp-content/uploads/2/8/0000632782/logo-radio-mora-untertitel-deutsch-web-rz-360x240.png"}'

echo "creating aracityradio repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create aracityradio
echo "adding Orange 94,0 ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r aracityradio repco:datasource:rss '{"endpoint":"https://aracityradio.com/shows?format=rss", "url":"https://aracityradio.com","name":"Radio ARA","image":"","thumbnail":""}'

echo "creating aracityradio repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create civiltavasz
echo "adding Radio Civil Tavasz ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r civiltavasz repco:datasource:rss '{"endpoint":"https://civiltavasz.hu/feed/", "url":"https://civiltavasz.hu","name":"Radio Civil Tavasz","image":"","thumbnail":""}'

echo "creating eucast repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create eucast
echo "adding Radio Civil Tavasz ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r eucast repco:datasource:rss '{"endpoint":"https://anchor.fm/s/f3d38ea4/podcast/rss", "url":"Eucast.rs","name":"Eucast.rs","image":"","thumbnail":""}'

echo "creating city-rights-radio repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create city-rights-radio
echo "adding City Rights Radio ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r city-rights-radio repco:datasource:rss '{"endpoint":"https://anchor.fm/s/64ede338/podcast/rss", "url":"https://anchor.fm/s/64ede338/podcast/rss","name":"City Rights Radio","image":"","thumbnail":""}'

echo "creating lazy-women repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create lazy-women
echo "adding Lazy Women ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r lazy-women repco:datasource:rss '{"endpoint":"https://anchor.fm/s/d731801c/podcast/rss", "url":"https://lazywomen.com/","name":"Lazy Women","image":"","thumbnail":""}'

echo "creating eurozine repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create eurozine
echo "adding Eurozine ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r eurozine repco:datasource:transposer '{"endpoint":"https://www.eurozine.com/wp-json/transposer/v1/repco", "url":"https://www.eurozine.com/","name":"Eurozine","image":"","thumbnail":""}'

echo "creating voxeurop repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create voxeurop
echo "adding Voxeurop ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r voxeurop repco:datasource:transposer '{"endpoint":"https://voxeurop.eu/wp-json/transposer/v1/repco", "url":"https://voxeurop.eu","name":"Voxeurop","image":"","thumbnail":""}'

echo "creating krytyka-polityczna repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create krytyka-polityczna
echo "adding Krytyka Polityczna ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r krytyka-polityczna repco:datasource:transposer '{"endpoint":"https://krytykapolityczna.pl/wp-json/transposer/v1/repco", "url":"https://krytykapolityczna.pl","name":"Krytyka Polityczna","image":"","thumbnail":""}'

echo "creating eldiario repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create eldiario
echo "adding ElDiario ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r eldiario repco:datasource:rss '{"endpoint":"https://www.eldiario.es/rss/category/tag/1048911", "url":"https://www.eldiario.es/","name":"ElDiario","image":"","thumbnail":""}'

echo "creating migrant-women repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create migrant-women
echo "adding Migrant Women Press ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r migrant-women repco:datasource:rss '{"endpoint":"https://migrantwomenpress.com/feed/", "url":"https://migrantwomenpress.com/","name":"Migrant Women Press","image":"","thumbnail":""}'

echo "creating vreme repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create vreme
echo "adding Vreme ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r vreme repco:datasource:rss '{"endpoint":"https://anchor.fm/s/f124f260/podcast/rss", "url":"https://www.vreme.com/","name":"Vreme","image":"","thumbnail":""}'

echo "creating cins repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create cins
echo "adding cins ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r cins repco:datasource:rss '{"endpoint":"https://anchor.fm/s/e8747e38/podcast/rss", "url":"https://www.cins.rs/en/","name":"Center for Investigative Journalism Serbia","image":"https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_nologo/38899486/38899486-1693856314696-a8d5a7cbd3557.jpg","thumbnail":""}'

echo "creating sound-of-thought repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create sound-of-thought
echo "adding Sound of Thought (Institute for Philosophy and social theory) ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r sound-of-thought repco:datasource:rss '{"endpoint":"https://anchor.fm/s/d9850604/podcast/rss", "url":"https://ifdt.bg.ac.rs/?lang=en","name":"Sound of Thought (Institute for Philosophy and social theory)","image":"https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_nologo/36393737/36393737-1686347856464-23acb9a41f5fd.jpg","thumbnail":""}'

echo "creating klima-101 repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create klima-101
echo "adding Klima 101 ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r klima-101 repco:datasource:rss '{"endpoint":"https://anchor.fm/s/da0dc82c/podcast/rss", "url":"https://klima101.rs/","name":"Klima 101","image":"https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_nologo/36483363/0867d5a20d2805b0.jpeg","thumbnail":""}'

echo "creating masteringpublicspace repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create masteringpublicspace
echo "adding masteringpublicspace ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r masteringpublicspace repco:datasource:rss '{"endpoint":"https://www.masteringpublicspace.org/rss", "url":"https://www.cityspacearchitecture.org/","name":"CITY SPACE ARCHITECTURE","image":"https://www.cityspacearchitecture.org/images/2018-09/logo_portal.jpg","thumbnail":"https://www.cityspacearchitecture.org/images/2018-09/logo_portal.jpg"}'

echo "creating naratorium repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create naratorium
echo "adding Naratorium ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r naratorium repco:datasource:rss '{"endpoint":"https://naratorium.ba/feed", "url":"https://naratorium.ba/","name":"Naratorium","image":"","thumbnail":""}'

echo "creating new-eastern-europe repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create new-eastern-europe
echo "adding New Eastern Europe ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r new-eastern-europe repco:datasource:rss '{"endpoint":"https://www.spreaker.com/show/4065065/episodes/feed", "url":"https://neweasterneurope.eu/","name":"New Eastern Europe","image":"","thumbnail":""}'
