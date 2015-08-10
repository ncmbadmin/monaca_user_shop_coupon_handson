var appKey    = "YOUR_APPKEY";
var clientKey = "YOUR_CLIENTKEY";

///// Called when app launch
$(function() {
  $("#LoginBtn").click(onLoginBtn);
  $("#RegisterBtn").click(onRegisterBtn);
  $("#YesBtn_logout").click(onLogoutBtn);
  NCMB.initialize(appKey, clientKey);
});

//----------------------------------USER MANAGEMENT-------------------------------------//
var currentLoginUser; //現在ログイン中ユーザー
var isCheckIn = null; //現在チェックイン中ステータス

function onRegisterBtn()
{
    //起動時にmobile backend APIキーを設定
    var username = $("#reg_username").val();
    var password = $("#reg_password").val();
    
    var user = new NCMB.User();
    user.set("userName", username);
    user.set("password", password);
    
    // 任意フィールドに値を追加 
    user.signUp(null, {
        success: function(user) {
            alert("新規登録に成功");
            currentLoginUser = NCMB.User.current();
            $.mobile.changePage('#MapPage');
        },
        error: function(user, error) {
            alert("新規登録に失敗！次のエラー発生： " + error.message);
        }
    });
}

function onLoginBtn()
{
    var username = $("#login_username").val();
    var password = $("#login_password").val();
    // ユーザー名とパスワードでログイン
    NCMB.User.logIn(username, password, {
        success: function(user) {
            alert("ログイン成功");
            currentLoginUser = NCMB.User.current();
            $.mobile.changePage('#MapPage');
        },
        error: function(user, error) {
            alert("ログイン失敗！次のエラー発生: " + error.message);
        }
    });
}

function onLogoutBtn()
{
    NCMB.User.logOut();
    alert('ログアウト成功');
    currentLoginUser = null;
    $.mobile.changePage('#LoginPage');
}

//----------------------------------SHOW MAP-------------------------------------//

//現在地を取得成功したら
var onSuccess = function(position){
    var location = { lat: position.coords.latitude, lng: position.coords.longitude};
    //mobile backendに登録しているストアを取得し、地図で表示
    //位置情報を検索するクラスのNCMB.Objectを作成する
    var StoreClass = NCMB.Object.extend("Store");
    //NCMB.Queryを作成
    var query = new NCMB.Query(StoreClass);
    //位置情報をもとに検索する条件を設定
    var geoPoint = new NCMB.GeoPoint(location.lat, location.lng);
    query.withinKilometers("geolocation", geoPoint, 5);
    var mapOptions = {
                    center: location,
                    zoom: 14
                };
    var map = new google.maps.Map(document.getElementById('map_canvas'),mapOptions);
    //現在地を地図に追加
    markToMap("現在地", location, map, null);
    //mobile backend上のデータ検索を実行する
    query.find({
        success: function(stores) {      
            // 検索が成功した場合の処理
            for (var i = 0; i < stores.length; i++){
                var store = stores[i];
                var storeLocation = store.get("geolocation");              
                var myLatlng = new google.maps.LatLng(storeLocation.latitude, storeLocation.longitude);
                //CREATE DETAIL
                var detail = "";
                var storeName = store.get("name");
                detail += "<h2>"+ storeName +"</h2>";
                var storeCapacity = store.get("capacity");
                var storeLocation = store.get("geolocation");
                var storeLatLng = new google.maps.LatLng(storeLocation.latitude,storeLocation.longitude);
                var locationLatLng = new google.maps.LatLng(location.lat,location.lng);
                var distance = Math.round(google.maps.geometry.spherical.computeDistanceBetween (locationLatLng, storeLatLng));  
                detail += "<p>距離: "+ distance + "(m)</p>";
                detail += "<p>席数: " + storeCapacity + "</p>" ;
                detail += '<button onclick="showCoupon(\'' + store.id + '\');">クーポンを見る</button>';
                markToMap(detail, myLatlng, map, 'images/marker_mbaas.png');     
            }
        },
        error: function(error) {
            // 検索に失敗した場合の処理
            alert(error.message);
        }
    });
};

//位置情報取得に失敗した場合のコールバック
var onError = function(error){
    alert("現在位置を取得できませんでした");
};

//地図でマーク表示
function markToMap(name, position, map, icon){
    var marker = new google.maps.Marker({
        position: position,
        title:name,
        icon: icon
    });
    marker.setMap(map);
    google.maps.event.addListener(marker, 'click', function() {
        var infowindow = new google.maps.InfoWindow({
            content:marker.title
        });
        infowindow.open(map,marker);
    });
}

//現在地を取得する
function showMap(){
    navigator.geolocation.getCurrentPosition(onSuccess, onError, null);
};


//----------------------------------COUPON SHOW-------------------------------------//

function getCouponList(storeId) {
        //Coupon情報を表示      
         $("#CouponListView").empty();
        var CouponClass = NCMB.Object.extend("Coupon");
        var query = new NCMB.Query(CouponClass);
        var StoreClass = NCMB.Object.extend("Store");
        var store = new StoreClass();
        store.set("objectId",storeId);
        query.equalTo("Store", store);
        query.find({
            success: function(results) {
                for (var i = 0; i < results.length; i++) {
                    var detail = "{'couponid':" +  results[i].id + "\n" 
                               + "'userid':"   +  currentLoginUser.id + "\n" 
                               + "'storeid':"  +  storeId + "}";
                    var showDetail = "<h2>" + results[i].get("Title") + "</h2>" 
                               + "<div id='"+ results[i].id +"'></div>";
                    $li = $("<li>"+ showDetail +"</li>");
                    $("#CouponListView").prepend($li);
                    $('#' + results[i].id).qrcode(detail);                  
                }                      
            }, 
            error: function(store, error) {
                alert(error);
            }
        });  
}


function showCoupon(storeId) {
    getCouponList(storeId);
    $.mobile.changePage('#CouponPage');
}