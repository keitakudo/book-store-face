/* jshint curly:true, debug:true */
/* globals $, firebase */


/**
 * -------------------
 * ストア詳細画面関連の関数
 * -------------------
 */
 // Realtime Database の books から書籍を削除する
const deleteStore = (storeId) => {
  // store から該当の書籍データを削除
  firebase
    .database()
    .ref('store')
    .child(storeId)
    .remove();
};
 

// 店舗の表示用のdiv（jQueryオブジェクト）を作って返す
const createStoreDiv = (storeId, storeData) => {
  // HTML内のテンプレートからコピーを作成
  const $divTag = $('#store-template > .store-item').clone();

  // 店舗情報を表示する
  $divTag.find('.store__title').text(storeData.storeTitle);
  $divTag.find('.store__child').text(storeData.storeChild);
  $divTag.find('.store__art').text(storeData.storeArt);
  $divTag.find('.store__address').text(storeData.storeAddress);
  $divTag.find('.store__station').text(storeData.storeStation);
  $divTag.find('.store__note').text(storeData.storeNote);
  $divTag.find('.store__phone').text(storeData.storePhone);
  $divTag.find('.store__mail').text(storeData.storeMail);
  $divTag.find('.store__report').text(storeData.storeReport);

// 削除ボタンのイベントハンドラを登録
  const $deleteButton = $divTag.find('.store-item__delete');
  $deleteButton.on('click', () => {
    deleteStore(storeId);
  });

  // 店舗の表紙画像をダウンロードして表示
  downloadStoreImage(storeData.storeImageLocation).then((url) => {
    displayStoreImage($divTag, url);
  });
  
  // id属性をセット
  $divTag.attr('id', `store-id-${storeId}`);
  
  return $divTag;
};



// 店舗画像をダウンロード
const downloadStoreImage = storeImageLocation => firebase
  .storage()
  .ref(storeImageLocation)
  .getDownloadURL()
  .catch((error) => {
    console.error('写真のダウンロードに失敗:', error);
  });

// 店舗画像を表示する
const displayStoreImage = ($divTag, url) => {
  $divTag.find('.store__image').attr({
    src: url,
  });
};

// 店舗画面内の店舗データをクリア
const resetBookStoreView = () => {
  $('#store-list').empty();
};

// 店舗画面に店舗データを表示する
const addStore = (storeId, storeData) => {
  const $divTag = createStoreDiv(storeId, storeData);
  $divTag.appendTo('#store-list');

};

// 店舗画面の初期化、イベントハンドラ登録処理
const loadBookStoreFaceView = () => {
  resetBookStoreView();

  // 店舗データを取得
  const storeRef = firebase
    .database()
    .ref('store')
    .orderByChild('createdAt');

  // 過去に登録したイベントハンドラを削除
  storeRef.off('child_removed');
  storeRef.off('child_added');
  // （データベースから書籍が削除されたときの処理）
  storeRef.on('child_removed', (storeSnapshot) => {
    const storeId = storeSnapshot.key;
    const $store = $(`#store-id-${storeId}`);
 // 書籍一覧画面から該当の書籍データを削除する
  $store.remove();
  });

  // store の child_addedイベントハンドラを登録
  // （データベースに書籍が追加保存されたときの処理）
  storeRef.on('child_added', (storeSnapshot) => {
    const storeId = storeSnapshot.key;
    const storeData = storeSnapshot.val();

    // 店舗一覧画面に店舗データを表示する
    addStore(storeId, storeData);
  });
};

/**
 * ----------------------
 * すべての画面共通で使う関数
 * ----------------------
 */

// ビュー（画面）を変更する
const showView = (id) => {
  $('.view').hide();
  $(`#${id}`).fadeIn();

  if (id === 'book_store_face') {
    loadBookStoreFaceView();
  }
};
/**
 * -------------------------
 * ログイン・ログアウト関連の関数
 * -------------------------
 
 /+/*/
// ログインフォームを初期状態に戻す
const resetLoginForm = () => {
  $('#login__help').hide();
  $('#login__submit-button').text('ログイン');
};

// ログインした直後に呼ばれる
const onLogin = () => {
  console.log('ログイン完了');

  // 書籍一覧画面を表示
  showView('book_store_face');
};

// ログアウトした直後に呼ばれる
const onLogout = () => {
  const storeRef = firebase.database().ref('store');

  // 過去に登録したイベントハンドラを削除
  storeRef.off('child_added');

  showView('login');
};

/**
 * ------------------
 * イベントハンドラの登録
 * ------------------
 */
// ログイン状態の変化を監視する
firebase.auth().onAuthStateChanged((user) => {
  // ログイン状態が変化した
  if (user) {
    // ログイン済
    onLogin();
  } else {
    // 未ログイン
    onLogout();
  }
});

// ログインフォームが送信されたらログインする
$('#login-form').on('submit', (e) => {
  e.preventDefault();

  const $loginButton = $('#login__submit-button');
  $loginButton.text('送信中…');

  const email = $('#login-email').val();
  const password = $('#login-password').val();

  firebase
    .auth()
    .signInWithEmailAndPassword(email,password)
    .then(() =>{
      //ログインに成功した時の処理
      console.log('ログインしました');
      
      //ログインフォームを初期状態に戻す
      resetLoginForm();
    })
    .catch((error) => {
      //ログインに失敗した時の処理
      console.error('ログインエラー',error);
      
      $('#login__help')
      .text('ログインに失敗しました')
      .show();
      
      //ログインボタンを元に戻す
      $loginButton.text('ログイン');
    });
});

// ログアウトボタンが押されたらログアウトする
$('.logout-button').on('click', () => {
  firebase
    .auth()
    .signOut()
    .catch((error) => {
      console.error('ログアウトに失敗:', error);
    });
});

//google Maps API

  var map;
  var marker;
  var infoWindow;
  
  function initMap() {
  
    //マップ初期表示の位置設定
    var target = document.getElementById('target');
    var centerp = {lat: 35.696952, lng: 139.7574923};
  
    //マップ表示
    map = new google.maps.Map(target, {
      center: centerp,
      zoom: 12,
      disableDefaultUI: true,
    });
    
  
    // 検索実行ボタンが押下されたとき
    document.getElementById('search').addEventListener('click', function() {
  
      var place = document.getElementById('keyword').value;
      var geocoder = new google.maps.Geocoder();      // geocoderのコンストラクタ
  
      geocoder.geocode({
        address: place
      }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
  
          var bounds = new google.maps.LatLngBounds();
  
          for (var i in results) {
            if (results[0].geometry) {
              // 緯度経度を取得
              var latlng = results[0].geometry.location;
              // 住所を取得
              var address = results[0].formatted_address;
              // 検索結果地が含まれるように範囲を拡大
              bounds.extend(latlng);
              // マーカーのセット
              setMarker(latlng);
              // マーカーへの吹き出しの追加
              setInfoW(place, latlng, address);
              // マーカーにクリックイベントを追加
              markerEvent();
            }
          }
        } else if (status == google.maps.GeocoderStatus.ZERO_RESULTS) {
          alert("見つかりません");
        } else {
          console.log(status);
          alert("エラー発生");
        }
      });
  
    });
  }
  
  // マーカーのセットを実施する
  function setMarker(setplace) {
    // 既にあるマーカーを削除
    deleteMakers();
  
    var iconUrl = 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';
      marker = new google.maps.Marker({
        position: setplace,
        map: map,
        icon: iconUrl
      });
    }
  
    //マーカーを削除する
    function deleteMakers() {
      if(marker != null){
        marker.setMap(null);
      }
      marker = null;
    }
  
    // マーカーへの吹き出しの追加
    function setInfoW(place, latlng, address) {
      infoWindow = new google.maps.InfoWindow({
      content: "<a href='http://www.google.com/search?q=" + place + "' target='_blank'>" + place + "</a><br><br>" + latlng + "<br><br>" + address + "<br><br><a href='http://www.google.com/search?q=" + place + "&tbm=isch' target='_blank'>画像検索 by google</a>"
    });
  }
  
  // クリックイベント
  function markerEvent() {
    marker.addListener('click', function() {
      infoWindow.open(map, marker);
    });
  }

/**
 * -------------------------
 * 店舗情報追加モーダル関連の処理
 * -------------------------
 */

// 店舗の登録モーダルを初期状態に戻す
const resetAddStoreModal = () => {
  $('#store-form')[0].reset();
  $('#submit_add_store')
    .prop('disabled', false)
    .text('保存する');
};

// 選択した店舗画像の、ファイル名を表示する
$('#add-store-image').on('change', (e) => {
  const input = e.target;
  const file = input.files[0];
  const $label = $('#add-store-image-label');

  if (file != null) {
    $label.text(file.name);
  } else {
    $label.text('ファイルを選択');
  }
});

// 店舗の登録処理
$('#store-form').on('submit', (e) => {
  e.preventDefault();

  // 店舗の登録ボタンを押せないようにする
  $('#submit_add_store')
    .prop('disabled', true)
    .text('送信中…');

  // 店舗データ
  const storeTitle = $('#add-store-title').val();
  const storeChild = $('#add-store-child').val();
  const storeArt = $('#add-store-art').val();
  const storeAddress = $('#add-store-address').val();
  const storeStation = $('#add-store-station').val();
  const storeNote = $('#add-store-note').val();
  const storePhone = $('#add-store-phone').val();
  const storeMail = $('#add-store-mail').val();
  const storeReport = $('#add-store-report').val();
  const $storeImage = $('#add-store-image');
  const { files } = $storeImage[0];

  if (files.length === 0) {
    // ファイルが選択されていないなら何もしない
    return;
  }

  const file = files[0]; // 店舗画像ファイル
  const filename = file.name; // 画像ファイル名
  const storeImageLocation = `store-images/${filename}`; // 画像ファイルのアップロード先

  //店舗データを保存する
  firebase
    .storage()
    .ref(storeImageLocation)
    .put(file) // Storageへファイルアップロードを実行
    .then(() => {
      // Storageへのアップロードに成功したら、Realtime Databaseに店舗データを保存する
      const storeData = {
        storeTitle,
        storeChild,
        storeArt,
        storeAddress,
        storeStation,
        storeNote,
        storePhone,
        storeMail,
        storeReport,
        storeImageLocation,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
      };
      
      return firebase
        .database()
        .ref('store')
        .push(storeData);
    })
    .then(() => {
      // 書籍一覧画面の書籍の登録モーダルを閉じて、初期状態に戻す
      $('#add-store-modal').modal('hide');
      resetAddStoreModal();
    })
    .catch((error) => {
      // 失敗したとき
      console.error('エラー', error);
      resetAddStoreModal();
      $('#add-store__help')
        .text('保存できませんでした。')
        .fadeIn();
    });
});  

/**
 * -------------------------
 * レポート情報追加モーダル関連の処理
 * -------------------------
 */
/*
// 店舗の登録モーダルを初期状態に戻す
const resetReportStoreModal = () => {
  $('#store-report-form')[0].reset();
  $('#submit_report_store')
    .prop('disabled', false)
    .text('保存する');
};

// 店舗の登録処理
$('#store-report-form').on('submit', (e) => {
  e.preventDefault();

  // 店舗の登録ボタンを押せないようにする
  $('#submit_report_store')
    .prop('disabled', true)
    .text('送信中…');

  //店舗データを保存する
  const storeReport = $('#report-store-report').val();
  
  firebase
    .database()
    .ref('store')
    .update(storeReport)
    .then(() => {
      // 書籍一覧画面の書籍の登録モーダルを閉じて、初期状態に戻す
      $('#report-store-modal').modal('hide');
      resetReportStoreModal();
    })
    .catch((error) => {
      // 失敗したとき
      console.error('エラー', error);
      resetReportStoreModal();
      $('#report-store__help')
        .text('保存できませんでした。')
        .fadeIn();
    });
});  
*/
/**
 * -------------------------
 * 店舗情報編集モーダル関連の処理
 * -------------------------
 */
/*
// 店舗の登録モーダルを初期状態に戻す
const resetEditStoreModal = () => {
  $('#store-edit-form')[0].reset();
  $('#submit_edit_store')
    .prop('disabled', false)
    .text('保存する');
};

// 選択した店舗画像の、ファイル名を表示する
$('#edit-store-image').on('change', (e) => {
  const input = e.target;
  const file = input.files[0];
  const $label = $('#edit-store-image-label');

  if (file != null) {
    $label.text(file.name);
  } else {
    $label.text('ファイルを選択');
  }
});

// 店舗の登録処理
$('#store-edit-form').on('submit', (e) => {
  e.preventDefault();

  // 店舗の登録ボタンを押せないようにする
  $('#submit_edit_store')
    .prop('disabled', true)
    .text('送信中…');

  // 店舗データ
  const storeTitle = $('#edit-store-title').val();
  const storeChild = $('#edit-store-child').val();
  const storeArt = $('#edit-store-art').val();
  const storeAddress = $('#edit-store-address').val();
  const storeStation = $('#edit-store-station').val();
  const storeNote = $('#edit-store-note').val();
  const storePhone = $('#edit-store-phone').val();
  const storeMail = $('#edit-store-mail').val();
  const $storeImage = $('#edit-store-image');
  const { files } = $storeImage[0];

  if (files.length === 0) {
    // ファイルが選択されていないなら何もしない
    return;
  }

  const file = files[0]; // 店舗画像ファイル
  const filename = file.name; // 画像ファイル名
  const storeImageLocation = `store-images/${filename}`; // 画像ファイルのアップロード先

  //店舗データを保存する
  firebase
    .storage()
    .ref(storeImageLocation)
    .update(file) // Storageへファイルアップロードを実行
    .then(() => {
      // Storageへのアップロードに成功したら、Realtime Databaseに店舗データを保存する
      const storeData = {
        storeTitle,
        storeChild,
        storeArt,
        storeAddress,
        storeStation,
        storeNote,
        storePhone,
        storeMail,
        storeImageLocation,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
      };
      return firebase
        .database()
        .ref('store')
        .update(storeData);
    })
    .then(() => {
      // 書籍一覧画面の書籍の登録モーダルを閉じて、初期状態に戻す
      $('#edit-store-modal').modal('hide');
      resetEditStoreModal();
    })
    .catch((error) => {
      // 失敗したとき
      console.error('エラー', error);
      resetEditStoreModal();
      $('#edit-store__help')
        .text('保存できませんでした。')
        .fadeIn();
    });
});  
*/
