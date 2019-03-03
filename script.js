const makeQuery = (pageNumber, nPerPage) => {
  return {
    "v": 3,
    "q": {
      "find": {
        "out.s1": "19HxigV4QyBv3tHpQVcUEQyq1pzZVdoAut",
        "out.s3": {
          "$regex": "^audio"
        }
      },
      "skip": pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0,
      "limit": nPerPage
    },
    "r": {
      "f": "[.[] | { h: .tx.h, lb2: .out[0].lb2, s3: .out[0].s3 }]"
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
      var result = r.c;
      result.forEach((a) => {
        if (!!a.lb2) {
          let src = "data:" + a.s3 + ";base64, " + a.lb2
          console.log(a.s3)
          let e = makeElement(a.h, a.s3, src, p)

          Gallery.insertAdjacentHTML('beforeend', e)
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

function makeElement(hash, type, src, page) {
  let e = `
  <li class="card mb-3 text-center">
    <div class="card-body d-flex justify-content-center">
      <audio class="page_${page}" controls="controls" autobuffer="autobuffer">
        <source src="${src}">
      </audio>
    </div>
    <div class"card-footer text-muted">H: ${hash}</div>
  </li>`

  return e
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
