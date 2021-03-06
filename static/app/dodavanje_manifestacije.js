Vue.component("add-manifestation", {
	data: function () {
		    return {
		    	currentPosition: {lat: 45.2671, lon: 19.8335}
		    }
	},
	template: ` 
<div>
		<h1>Dodaj manifestaciju: </h1>
		
		<div style="display: inline-block;">
		<table>
			<tr>
				<td> <h2>Naziv:</h2> </td> <td> <input type="text" name="naziv"/> </td>
			</tr>
			<tr>
				<td> <h2>Broj mijesta:</h2> </td> <td> <input type="number" name="mesta"/> </td>
			</tr>
			<tr>
				<td> <h2>Cijena REGULAR karte:</h2> </td> <td> <input type="number" name="cijena"/> </td>
			</tr>
			<tr>
				<td> <h2>Tip manifestacije:</h2> </td>
				<td>
					<select name="tip" id="tip" >
					  <option value="KONCERT">KONCERT</option>
					  <option value="FESTIVAL">FESTIVAL</option>
					  <option value="POZORISTE">POZORISTE</option>
					</select>
				</td> 
			</tr>
			<tr>
				<td><h2>Datum odrzavanja:</h2></td>
				<td> <input type="date" id="datum" name="datum"> </td>
			</tr>
			<tr>
				<td><h2>Vreme odrzavanja:</h2></td>
				<td> <input type="time" id="vrijeme" name="vrijeme" min="00:00" max="23:59"> </td>
			</tr>
			<tr>
				<td> <h2>Geografska sirina:</h2> </td> <td> <input type="number" name="sirina" v-model="currentPosition.lat" /> </td>
			</tr>
			<tr>
				<td> <h2>Geografska duzina:</h2> </td> <td> <input type="number" name="duzina" v-model="currentPosition.lon" /> </td>
			</tr>
			<tr>
				<td> <h2>Adresa:</h2> </td> <td> <input type="text" name="adresa"/> </td>
			</tr>
			<tr>
				<td> <h2>Poster:</h2> </td> <td> <input type="file" id="poster" name="poster"> </td>
			</tr>
			<tr>
				<td align=center colspan=2>
					<input type="button" value="Posalji" v-on:click="registerManif()"/>
				</td>
			</tr>
		</table>
		</div>
		
		
		<div id="map" class="map-right" ></div>
		
</div>		  
`
	, 
	methods : {
		showMap : function(){
			let self = this;
			
			var vectorSource = new ol.source.Vector({});
		    var vectorLayer = new ol.layer.Vector({source: vectorSource});
			
			var map = new ol.Map({
		        target: 'map',
		        layers: [
		          new ol.layer.Tile({
		            source: new ol.source.OSM()
		          }),vectorLayer
		        ],
		        view: new ol.View({
		          center: ol.proj.fromLonLat([19.8335, 45.2671]),
		          zoom: 11
		        })
		      });
		      
			var marker;
			  
			setMarker = function(position) {
				marker = new ol.Feature(new ol.geom.Point(ol.proj.fromLonLat(position)));
				vectorSource.addFeature(marker);
			}
			
			map.on("click", function(event){
				let position = ol.proj.toLonLat(event.coordinate);
				self.currentPosition.lat = parseFloat(position.toString().split(",")[1]).toFixed(6);
				self.currentPosition.lon = parseFloat(position.toString().split(",")[0]).toFixed(6);
				vectorSource.clear();
				setMarker(position);
			});
			
		}, 
		registerManif : function () {
			let naz = $("input[name=naziv]").val();
			let mesta = $("input[name=mesta]").val();
			let cena = $("input[name=cijena]").val();
			let tip = $('#tip option:selected').val();
			let dat = $("input[name=datum]").val();
			let date = (new Date(dat)).getTime();
			let vreme = $("input[name=vrijeme]").val();
			date += (parseInt(vreme.split(":")[0])-1)*3600000 + parseInt(vreme.split(":")[1])*60000;
			
			let sirina = $("input[name=sirina]").val();
			let duzina = $("input[name=duzina]").val();
			let addr = $("input[name=adresa]").val();
			
			if(naz.trim() == "" || isNaN(mesta) || dat.trim() == "" || isNaN(sirina) || isNaN(duzina) || addr.trim() == "" || vreme.trim() == ""){
				alert("Popunite sva polja.");
				return;
			}
			
			if(naz.includes(";") || addr.includes(";")){
				alert("Polja sadrze nedozvoljene karaktere!");
				return;
			}
			
			let input = document.querySelector('input#poster');
			let file = input.files[0];
			let reader = new FileReader();
			
			reader.onloadend = function () {
			    // Since it contains the Data URI, we should remove the prefix and keep only Base64 string
			    let b64 = reader.result.replace(/^data:.+;base64,/, '');
			    console.log(b64); //-> "R0lGODdhAQABAPAAAP8AAAAAACwAAAAAAQABAAACAkQBADs="
			    
			    let obj = {naziv : naz.trim(),
					tipManifestacije : tip,
					datumOdrzavanja : date,
					brojMesta : mesta,
					cenaRegular : cena,
					lokacija : {geografskaSirina: sirina, geografskaDuzina: duzina, adresa: addr.trim()},
					slika : b64};
					
				$.post("/rest/manifestations/add", JSON.stringify(obj), function(data){
				if(data == "Done"){
					alert("Uspesno dodato.");
				}else{
					alert("Vec rezervisano.")
				}
			});
			    
			};
			
			try{
  				reader.readAsDataURL(file);
			}catch(exception){
				alert("Morate uneti sliku.");
				return;
			}
			
		} 
	},
	mounted () {
		let self = this;
		$.ajax({
			url: "/rest/users/currentUser",
			method: "GET",
			success: function(data){
				if(data === null || data.uloga != "PRODAVAC"){
					window.location.href = "#/login";
				}else{
					self.showMap();
				}
			}
		});
    }
});