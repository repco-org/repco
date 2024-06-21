#!/bin/bash
echo "Configuring repco repos and datasources"

echo "creating orange repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create orange
echo "adding Orange 94,0 ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r orange repco:datasource:cba '{"endpoint":"https://cba.media/wp-json/wp/v2", "stationId":262317, "url":"http://www.o94.at/","name":"Orange 94,0","image":"https://cba.media/wp-content/uploads/7/0/0000474207/orange.gif","thumbnail":"https://cba.media/wp-content/uploads/7/0/0000474207/orange-360x240.gif"}'

echo "creating fro repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create fro
echo "adding Radio FRO ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r fro repco:datasource:cba '{"endpoint":"https://cba.media/wp-json/wp/v2", "stationId":262315, "url":"https://www.fro.at/","name":"Radio FRO","image":"https://cba.media/wp-content/uploads/3/0/0000348503/fro-logo-w-os.jpg","thumbnail":"https://cba.media/wp-content/uploads/3/0/0000348503/fro-logo-w-os-360x240.jpg"}'

echo "creating radiofabrik repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create radiofabrik
echo "adding Radiofabrik ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r radiofabrik repco:datasource:cba '{"endpoint":"https://cba.media/wp-json/wp/v2", "stationId":262323, "url":"https://radiofabrik.at/","name":"Radiofabrik","image":"https://cba.media/wp-content/uploads/0/2/0000474220/radiofabrik.gif","thumbnail":"https://cba.media/wp-content/uploads/0/2/0000474220/radiofabrik-360x240.gif"}'

echo "creating frf repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create frf
echo "adding Freies Radio Freistadt ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r frf repco:datasource:cba '{"endpoint":"https://cba.media/wp-json/wp/v2", "stationId":262333, "url":"https://www.frf.at/","name":"Freies Radio Freistadt","image":"https://cba.media/wp-content/uploads/1/0/0000474201/frf.gif","thumbnail":"https://cba.media/wp-content/uploads/1/0/0000474201/frf-360x240.gif"}'

echo "creating freirad repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create freirad
echo "adding Freirad ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r freirad repco:datasource:cba '{"endpoint":"https://cba.media/wp-json/wp/v2", "stationId":262325, "url":"https://www.freirad.at/","name":"Freirad","image":"https://cba.media/wp-content/uploads/5/0/0000474205/freirad.gif","thumbnail":"https://cba.media/wp-content/uploads/5/0/0000474205/freirad-360x240.gif"}'

echo "creating radiohelsinki repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create radiohelsinki
echo "adding Radio Helsinki ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r radiohelsinki repco:datasource:cba '{"endpoint":"https://cba.media/wp-json/wp/v2", "stationId":262321, "url":"https://helsinki.at/","name":"Radio Helsinki","image":"https://cba.media/wp-content/uploads/4/7/0000649274/radio-helsinki-square-colour-cba.jpg","thumbnail":"https://cba.media/wp-content/uploads/4/7/0000649274/radio-helsinki-square-colour-cba-360x240.jpg"}'

echo "creating agora repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create agora
echo "adding Radio AGORA ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r agora repco:datasource:cba '{"endpoint":"https://cba.media/wp-json/wp/v2", "stationId":262319, "url":"https://www.agora.at/","name":"Radio AGORA","image":"https://cba.media/wp-content/uploads/4/9/0000630694/agora-fb-profilbild.jpg","thumbnail":"https://cba.media/wp-content/uploads/4/9/0000630694/agora-fb-profilbild-360x240.jpg"}'

echo "creating b138 repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create b138
echo "adding Radio B138 ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r b138 repco:datasource:cba '{"endpoint":"https://cba.media/wp-json/wp/v2", "stationId":262340, "url":"https://www.radiob138.at/","name":"Radio B138","image":"https://cba.media/wp-content/uploads/0/0/0000474200/b138.gif","thumbnail":"https://cba.media/wp-content/uploads/0/0/0000474200/b138-360x240.gif"}'

echo "creating frs repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create frs
echo "adding Freies Radio Salzkammergut ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r frs repco:datasource:cba '{"endpoint":"https://cba.media/wp-json/wp/v2", "stationId":262335, "url":"https://freiesradio.at/","name":"Freies Radio Salzkammergut","image":"https://cba.media/wp-content/uploads/3/0/0000474203/frs.gif","thumbnail":"https://cba.media/wp-content/uploads/3/0/0000474203/frs-360x240.gif"}'

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

docker restart repco-app