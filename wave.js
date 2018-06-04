(function () {

  'use strict';
  
   const KEYCODE = {
        SPACE: 32,
   };

   const template = document.createElement('template');
   template.innerHTML = "<style>::slotted(wave-button), ::slotted(wave-volume) {position: absolute;} ::slotted(wave-button):before, ::slotted(wave-button):after {content: ''; position:absolute; display:block} ::slotted(*){display:block;} ::slotted(wave-button) {/*background-image: url(playBtn.svg); background-repeat:no-repeat; background-size: contain; height:100px; width:100px;*/ margin-left: 4px;margin-top: 4px;width: 13px;height: 15px;} ::slotted(wave-button):after {right:0;} ::slotted(wave-button):after, ::slotted(wave-button):before {width: 3px;height: 12px;border: solid 1px #333333;} ::slotted(wave-progress) { height:20px; background-color:red;} ::slotted(wave-time){font-family:sans-serif;}</style><slot name='wave-button'></slot><slot name='wave-progress'></slot><slot name='wave-time'></slot>";

   
   function getContainer(el) {
       var result = el;
       while (result.nodeName != 'WAVE-CONTAINER' && result.nodeName != 'BODY') {
           result = result.parentElement;
       }
       if (result.nodeName == 'WAVE-CONTAINER')
           return result;
       else
           return false;
   }
   class WaveContainer extends HTMLElement {

        static get observedAttributes() {
            return ['src', 'disabled', 'loop', 'autoplay',];
        }

        constructor()  {
            super();
            this.attachShadow({ mode: 'open' });
            this.shadowRoot.appendChild(template.content.cloneNode(true));
            this.audio = new Audio();
        }

        get context() {
            return this.audio;
        }

        /* Attribute Workers */
        get source() {
            return this.getAttribute('source');
        }

        set source(src) {
            let type = src.substring(src.lastIndexOf(".") + 1);
            if (this.audio.canPlayType('audio/'+type)) {
                this.setAttribute('src', src);
                this.audio.src = src;
                this.audio.load();
            } else
                throw {
                    name: 'WaveInternal',
                    message: 'not valid source',
                };
        }

        get disabled() {
            return this.getAttribute('disabled');
        }

        set disabled(value) {
            const isDisabled = Boolean(value);
            if (isDisabled)
                this.setAttribute('disabled', '');
            else
                this.removeAttribute('disabled');
        }

        set loop(value) {
          const isLoopEnabled = Boolean(value);
          if (isLoopEnabled)
            this.setAttribute('loop', '');
          else
            this.removeAttribute('disabled');
          this.audio.loop = isLoopEnabled;
        }

        get loop() {
          return this.hasAttribute('loop');
        }

        set autoplay(value) {
          const isAutoplayEnabled = Boolean(value);
          if (isAutoplayEnabled)
            this.setAttribute('loop', '');
          else
            this.removeAttribute('disabled');
          this.play();
        }

        get autoplay() {
          return this.hasAttribute('autoplay');
        }

        /* Audio properties worker */

        get time() {
          console.log(this.audio.duration);
          return [this.audio.duration, this.audio.currentTime];
        }

        set time(value) {
            const time = Number(value);
            this.audio.currentTime = time;
        }

        get volume() {
          return this.audio.volume;
        }

        set volume(value) {
          const volume = Number(value);
          this.audio.volume = volume;
        }

        play() {
            if (this.audio.paused == true)
                this.audio.play();
            else
                this.audio.pause();
            return this;
        }

        /* Event Workers */

        connectedCallback() {

          if (this.hasAttribute('src')){
            this.source = this.getAttribute('src');
          }else
            throw {
              name: 'WaveInternal',
              message: 'source needed',
            }

          if (this.hasAttribute('loop'))
            this.loop = true;
          //defualt = false

          if(this.hasAttribute('autoplay'))
            this.autoplay = true;
            //default = false
        }
}

    class WaveButton extends HTMLElement {

        static get observedAttributes() {
            return ['disabled'];
        }

        constructor() {
            super();
        }

        set disabled(value) {
            const isDisabled = Boolean(value);

            if (isDisabled)
                this.setAttribute('disabled', '');
            else
                this.removeAttribute('disabled');
        }

        get disabled() {
            return this.hasAttribute('disabled');
        }

        get state() {
            return this._state;
        }

        set state(value) {
            this._state = Boolean(value);
        }

        connectedCallback() {
            if (!getContainer(this))
                return;

            this.setAttribute('slot', 'wave-button');

            this._state = false;

            this.addEventListener('click', this._onClick);
            this.addEventListener('keydown', this._onKeydown);

        }

        disconnectedCallback() {
            this.removeEventListener('click', this._onClick);
            this.removeEventListener('keydown', this._onKeydown);
        }

        /* state: true -> playing, state: false -> paused */

        _toggleState() {
            if (this.disabled)
                return;

            let prevState = this.state == undefined ? false : this.state;
            this.state = !this.state;

            if(prevState === true)
              this.style.backgroundImage = 'url(pauseBtn.svg)';
            else
              this.style.backgroundImage = 'url(playBtn.svg)';

            getContainer(this).play();

            // c'è ancora lavoro da fare qui...
            /*if(!customEvent)
              this.dispatchEvent(new Event('WaveBtnChange'));
            else
              this.dispatchEvent(new customEvent('WaveBtnChange', {'actualState': this.state, 'prevState': prevState,}));
            */
        }

        /* Event Workers */
        _onClick() {
            this._toggleState();
        }

        _onKeydown() {
            if (event.altKey)
                return;

            if (event.keyCode == KEYCODE.SPACE) {
                event.preventDefault;
                this.toggleState();
            }
        }
    }

    class WaveTime extends HTMLElement {

      static get observedAttributes() {
        return ['disabled'];
      }

      constructor() {
        super();
      }

      set disabled(value) {
          const isDisabled = Boolean(value);

          if (isDisabled)
              this.setAttribute('disabled', '');
          else
              this.removeAttribute('disabled');
      }

      get disabled() {
          return this.hasAttribute('disabled');
      }

      connectedCallback() {
        var container = getContainer(this);

        if (!getContainer(this))
            return;

        this.setAttribute('slot', 'wave-time');

        if(!this.disabled) {
          let time = container.time;
          this.innerHTML = time[1] + ' : ' + time[0];

          container.audio.addEventListener("timeupdate", _onTimeUpdate);
        }
      }

      disconnectedCallback() {
        container.audio.removeEventListener("timeupdate", _onTimeUpdate);
      }

      _onTimeUpdate() {

      }

    }

    class WaveProgress extends HTMLElement {

      static get observedAttributes() {
        return ['disabled'];
      }

      constructor() {
        super();
      }

      set disabled(value) {
          const isDisabled = Boolean(value);

          if (isDisabled)
              this.setAttribute('disabled', '');
          else
              this.removeAttribute('disabled');
      }

      get disabled() {
          return this.hasAttribute('disabled');
      }

      updateProgress() {
      }

      connectedCallback() {
        if (!getContainer(this))
            return;


        this.setAttribute('slot', 'wave-progress');
      }
    }

    class WaveMute extends HTMLElement {

    }



    customElements.define('wave-container', WaveContainer);
    customElements.define('wave-button', WaveButton);
    customElements.define('wave-progress', WaveProgress);
    customElements.define('wave-time', WaveTime);
   
}()
