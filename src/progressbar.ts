/*
* Forked from https://github.com/jacoborus/nanobar/
*/

export class ProgressBar {
  private active = true
  private value = 0
  private bar: HTMLDivElement

  constructor() {
    this.bar = document.getElementById('nc-progress-bar') as HTMLDivElement
    this.bar.addEventListener('transitionend', () => {
      if (this.value >= 100) {
        this.active = false
        this.bar.style.height = '0'
      }
    })
  }

  public increase = (val = 10) => {
    if (this.active) {
      this.value += val
      this.bar.style.width = this.value + '%'
    }
  }
}
