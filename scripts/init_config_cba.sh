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
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r proton repco:datasource:cba '{"endpoint":"https://cba.media/wp-json/wp/v2", "stationId":262342, "url":"https://radioproton.at","name":"Proton","image":"https://cba.media/wp-content/uploads/8/0/0000474208/proton.gif","thumbnail":"https://cba.media/wp-content/uploads/8/0/0000474208/proton-360x240.gif"}'

echo "creating cr 94,4 repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create cr944
echo "adding cr 94,4 ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r cr944 repco:datasource:cba '{"endpoint":"https://cba.media/wp-json/wp/v2", "stationId":262352, "url":"https://cr944.at","name":"Campus & Cityradio St. Pölten","image":"https://cba.media/wp-content/uploads/8/9/0000474198/campusradio.gif","thumbnail":"https://cba.media/wp-content/uploads/8/9/0000474198/campusradio.gif"}'

echo "creating Radio Freequenns repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create freequenns
echo "adding Radio Freequenns ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r freequenns repco:datasource:cba '{"endpoint":"https://cba.media/wp-json/wp/v2", "stationId":262331, "url":"https://www.freequenns.at/","name":"Radio Freequenns","image":"https://cba.media/wp-content/uploads/5/1/0000474215/freequenns.gif","thumbnail":"https://cba.media/wp-content/uploads/5/1/0000474215/freequenns-360x240.gif"}'

echo "creating Literadio repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create literadio
echo "adding Literadio ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r literadio repco:datasource:cba '{"endpoint":"https://cba.media/wp-json/wp/v2", "stationId":262364, "url":"https://www.literadio.at/","name":"Literadio","image":"https://cba.media/wp-content/uploads/6/0/0000474206/literadio-360x240.gif","thumbnail":"https://cba.media/wp-content/uploads/6/0/0000474206/literadio-360x240.gif"}'

echo "creating Radio Ypsilon repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create radioypsilon
echo "adding Radio Ypsilon ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r radioypsilon repco:datasource:cba '{"endpoint":"https://cba.media/wp-json/wp/v2", "stationId":262348, "url":"https://radioypsilon.at/","name":"Radio Ypsilon","image":"https://cba.media/wp-content/uploads/3/2/0000474223/radioypsilon.gif","thumbnail":"https://cba.media/wp-content/uploads/3/2/0000474223/radioypsilon-360x240.gif"}'

echo "creating Verband Freier Rundfunk Österreich repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create vfroe
echo "adding Verband Freier Rundfunk Österreich ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r vfroe repco:datasource:cba '{"endpoint":"https://cba.media/wp-json/wp/v2", "stationId":262344, "url":"https://www.freier-rundfunk.at/","name":"Verband Freier Rundfunk Österreich","image":"https://cba.media/wp-content/uploads/0/7/0000495370/vfroe-logo-schwarz.png","thumbnail":"https://cba.media/wp-content/uploads/0/7/0000495370/vfroe-logo-schwarz-360x240.png"}'

echo "creating Civilradio repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create civilradio
echo "adding Civilradio ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r civilradio repco:datasource:cba '{"endpoint":"https://cba.media/wp-json/wp/v2", "stationId":507716, "url":"https://civilradio.hu/","name":"Civilradio","image":"https://cba.media/wp-content/uploads/8/9/0000538598/civil-logo.gif","thumbnail":"https://cba.media/wp-content/uploads/8/9/0000538598/civil-logo-360x240.gif"}'

echo "creating fri repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create fri
echo "adding Freies Radio Innviertel ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r fri repco:datasource:cba '{"endpoint":"https://cba.media/wp-json/wp/v2", "stationId":580988, "url":"https://radio-fri.at/","name":"Freies Radio Innviertel","image":"https://cba.media/wp-content/uploads/4/6/0000608864/fri-freiesradioinnviertel-logo-cmyk.jpg","thumbnail":"https://cba.media/wp-content/uploads/4/6/0000608864/fri-freiesradioinnviertel-logo-cmyk-360x141.jpg"}'

echo "creating Aufdraht repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create aufdraht
echo "adding Aufdraht ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r aufdraht repco:datasource:cba '{"endpoint":"https://cba.media/wp-json/wp/v2", "stationId":262327, "url":"https://aufdraht.org/","name":"Aufdraht","image":"https://cba.media/wp-content/uploads/5/9/0000474195/aufdraht-1.gif","thumbnail":"https://cba.media/wp-content/uploads/5/9/0000474195/aufdraht-1-360x240.gif"}'

echo "creating Radius 106,6 repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create radius
echo "adding Radius 106,6 ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r radius repco:datasource:cba '{"endpoint":"https://cba.media/wp-json/wp/v2", "stationId":262329, "url":"https://aufdraht.org/","name":"Radius 106,6","image":"https://cba.media/wp-content/uploads/8/2/0000474228/radius.gif","thumbnail":"https://cba.media/wp-content/uploads/8/2/0000474228/radius-360x240.gif"}'

echo "creating mora repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create mora
echo "adding Radio MORA ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r mora repco:datasource:cba '{"endpoint":"https://cba.media/wp-json/wp/v2", "stationId":299489, "url":"https://www.radio-mora.at/","name":"Radio MORA","image":"https://cba.media/wp-content/uploads/2/8/0000632782/logo-radio-mora-untertitel-deutsch-web-rz.png","thumbnail":"https://cba.media/wp-content/uploads/2/8/0000632782/logo-radio-mora-untertitel-deutsch-web-rz-360x240.png"}'

echo "creating Radio Corax repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create corax
echo "adding Radio Corax ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r corax repco:datasource:cba '{"endpoint":"https://cba.media/wp-json/wp/v2", "stationId":262362, "url":"https://radiocorax.de/","name":"Radio Corax","image":"https://cba.media/wp-content/uploads/3/1/0000474213/corax.gif","thumbnail":"https://cba.media/wp-content/uploads/3/1/0000474213/corax-360x240.gif"}'

echo "creating Radio LORA repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create lora
echo "adding Radio LORA ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r lora repco:datasource:cba '{"endpoint":"https://cba.media/wp-json/wp/v2", "stationId":262358, "url":"https://lora924.de/","name":"Radio LORA","image":"https://cba.media/wp-content/uploads/9/5/0000262359/25.gif","thumbnail":"https://cba.media/wp-content/uploads/9/5/0000262359/25.gif"}'

echo "creating KUPF OÖ repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create kupf
echo "adding KUPF OÖ ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r kupf repco:datasource:cba '{"endpoint":"https://cba.media/wp-json/wp/v2", "stationId":501009, "url":"https://kupf.at/","name":"Kulturplattform Oberösterreich","image":"https://cba.media/wp-content/uploads/0/1/0000501010/kupf-kkk-by-kle.jpg","thumbnail":"https://cba.media/wp-content/uploads/0/1/0000501010/kupf-kkk-by-kle.jpg"}'

echo "creating IG feministische Autorinnen Wien repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create igfem
echo "adding IG feministische Autorinnen Wien ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r igfem repco:datasource:cba '{"endpoint":"https://cba.media/wp-json/wp/v2", "stationId":588725, "url":"https://igfem.at/","name":"IG feministische Autorinnen Wien","image":"https://cba.media/wp-content/uploads/5/3/0000629135/logo-igfem-social-media-schwarz.png","thumbnail":"https://cba.media/wp-content/uploads/5/3/0000629135/logo-igfem-social-media-schwarz.png"}'

echo "creating JKU - Institut für Legal Gender Studies repo..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco repo create legalgenderstudies
echo "adding JKU - Institut für Legal Gender Studies ds..."
docker compose -f "docker/docker-compose.arbeit.build.yml" -p arbeit exec app yarn repco ds add -r legalgenderstudies repco:datasource:cba '{"endpoint":"https://cba.media/wp-json/wp/v2", "stationId":631711, "url":"https://www.jku.at/institut-fuer-legal-gender-studies/","name":"Kulturplattform Oberösterreich","image":"https://cba.media/wp-content/uploads/7/1/0000631817/csm-cover-gender-recht-66-klein-neu-74e3662985.jpg","thumbnail":"https://cba.media/wp-content/uploads/7/1/0000631817/csm-cover-gender-recht-66-klein-neu-74e3662985-266x240.jpg"}'

docker restart repco-app