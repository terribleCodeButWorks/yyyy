'use strict';

const b64dataToBlob = (url) => {
  let blob = fetch(url).then(res => res.blob())
  // console.log(blob)
  return blob
}

const makeQuery = (pageNumber, nPerPage) => {
  return {
    "v": 3,
    "q": {
      "find": {
        "out.s1": "19HxigV4QyBv3tHpQVcUEQyq1pzZVdoAut",
        "out.s3": {
          "$regex": "^(video|audio)"
        }
      },
      "skip": pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0,
      "limit": nPerPage
    },
    "r": {
      "f": "[.[] | { h: .tx.h, lb2: .out[0].lb2, s3: .out[0].s3, s4: .out[0].s4, s5: .out[0].s5}]"
    }
  }
};
const LoadingStatus = document.querySelector('#status')
const toB64 = (q) => {
  return btoa(JSON.stringify(q))
}
const N_PER_PAGE = 2

const makeURL = (pageNumber) => {
  return "https://genesis.bitdb.network/q/1FnauZ9aUH2Bex6JzdcV4eNX7oLSSEbxtN/" + toB64(makeQuery(pageNumber, N_PER_PAGE))
}
const Gallery = document.querySelector("#gallery")
const TheHole = document.querySelector('#theHole')

var header = {
  headers: {
    key: "1KJPjd3p8khnWZTkjhDYnywLB2yE1w5BmU"
  }
};

class Counter {
  constructor() {
    this.started = 0
    this.done = 0
  }

  newTask() {
    return this.started += N_PER_PAGE
  }

  taskDown() {
    return this.done += N_PER_PAGE
  }

  couldBeginNewTask() {
    return (this.done >= 5) && (this.started - this.done < 5) // pending tasks less than 5
  }
}
let counter = new Counter()

async function fetchData() {
  let p = counter.newTask()
  console.log(p)
  LoadingStatus.innerHTML = 'Fetching...'
  await fetch(makeURL(p), header)
    .then(function(r) {
      // console.log(r)
      return r.json()
    })
    .then(function(r) {
      var result = r.c
      result.forEach(async (a) => {
        if (!!a.lb2) {
          let b64 = a.lb2
          console.log(a.s3, a.s4, a.s5)
          let e = await makeElement(a.h, a.s3, b64, p, a.s5)
          console.log(e)

          // Gallery.insertAdjacentHTM('beforeend', e)
          Gallery.appendChild(e)
        }
      })
    })
    .then(_ => {
      counter.taskDown()
      LoadingStatus.innerHTML = 'Done     :)'
    })
    .catch(_ => {
      window.removeEventListener('scroll', listenToBeginTask, true)
      LoadingStatus.innerHTML = 'No more  :p'
    })
}

async function makeElement(hash, type, b64, page, filename) {
  type = type === 'video/vnd.dlna.mpeg-tts' ? 'video/mp4' : type
  let url = `data:${type};base64, ` + b64
  let blob = await b64dataToBlob(url)
  console.log(blob)
  let blobUrl = URL.createObjectURL(blob)
  console.log(blobUrl)

  let media = document.createElement('video')
  media.src = blobUrl
  media.type = type
  media.controls = "controls"
  // let e = `
  // <li class="card mb-3 text-center">
  //   <div class="card-body d-flex justify-content-center">
  //     ${media}
  //   </div>
  //   <div class"card-footer text-muted">${filename || hash}</div>
  // </li>`

  return media
}

const listenToBeginTask = () => {
  // console.log('trigger')
  if (!counter.couldBeginNewTask()) {
    return
  }
  let theLatest = Gallery.lastChild
  if (theLatest.getBoundingClientRect().top - window.screen.height < 5000) { // when latest image near screen
    fetchData()
  }
}

window.addEventListener('scroll', listenToBeginTask, true)

let main = async function() {
  await fetchData()
  await fetchData()
  await fetchData()
  await fetchData()
  await fetchData()
}

main()
