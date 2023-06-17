/**
 * Import styles library
 */
import styles from './index.module.css';

/**
 * Import types
 */
import {spectrumData, spectrumConfig, Nodes} from './types';
import { API, BlockAPI, BlockTool } from '@editorjs/editorjs';
import {make} from "./utils";

/**
 * spectrum Tool for Editor.js
 */
export default class Spectrum implements BlockTool {
  /**
   * Code API — public methods to work with Editor
   *
   * @link https://editorjs.io/api
   */
  private readonly api: API;

  /**
   * Block API — methods and properties to work with Block instance
   *
   * @link https://editorjs.io/blockapi
   */
  private block: BlockAPI;

  /**
   * Read-only mode flag
   */
  private readonly readOnly: boolean;

  /**
   * Configuration object that passed through the initial Editor configuration.
   */
  private readonly config: spectrumConfig;

  /**
   * Tool data for input and output
   */
  private _data: spectrumData = {description: "", url: ""};

  private btnLoading = false;

  /**
   * Tool data for input and output
   */
  get data(): spectrumData {
    return this._data;
  }

  set data(data: spectrumData) {
    this._data = {...this.data, ...data};
  }

  /**
   * Tool's HTML nodes
   */
  private nodes: Nodes;

  /**
   * Class constructor
   *
   * @link https://editorjs.io/tools-api#class-constructor
   */
  constructor({data, config, api, block, readOnly}: {
    data: spectrumData,
    config: spectrumConfig,
    api: API,
    block: BlockAPI,
    readOnly: boolean
  }) {
    this.data = data;
    this.config = config || {};
    this.api = api;
    this.block = block;
    this.readOnly = readOnly;

    /**
     * Declare Tool's nodes
     */
    this.nodes = {
      wrapper: null,
      btn: null,
      img: null,
      caption: null,
      imgGallery: null
    };
  }

  /**
   * Describe an icon and title here
   * Required if Tools should be added to the Toolbox
   * @link https://editorjs.io/tools-api#toolbox
   *
   * @returns {{icon: string, title: string}}
   */
  static get toolbox() {
    return {
      title: 'AI Image',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image-plus"><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/><line x1="16" x2="22" y1="5" y2="5"/><line x1="19" x2="19" y1="2" y2="8"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>',
    };
  }

  /**
   * Notify core that read-only mode is supported
   *
   * @returns {boolean}
   */
  static get isReadOnlySupported() {
    return true;
  }

  /**
   * With this option, Editor.js won't handle Enter keydowns
   * @link https://editorjs.io/tools-api#enablelinebreaks
   *
   * @returns {boolean}
   */
  static get enableLineBreaks() {
    return true;
  }

  render() {
    this.nodes.wrapper = make('div', styles['spectrum-wrapper'])

    if (this.data && this.data.url) {
      this.loadImg(this.data.url, this.data.caption);
      return this.nodes.wrapper;
    }

    const box = make('div', styles['spectrum-box']);
    const input = make('input', null, {
      type: 'text',
      placeholder: 'Input image description which you want generate.',
      onkeydown: async (event: KeyboardEvent) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          const description = input.value;
          if (description) {
            await this.genImg(description);
          }
        }
      }
    }) as HTMLInputElement;

    this.nodes.imgGallery = make('div', styles['img-gallery']);
    this.nodes.imgGallery.innerHTML = '';

    this.nodes.btn = make('button', null, {
      ...(this.btnLoading ? { disabled: 'true' } : {})
    });
    this.nodes.btn.innerHTML = 'Generate';
    this.nodes.btn.addEventListener('click', async (event) => {
      event.preventDefault();
      const description = input.value;

      if (!this.btnLoading) {
        await this.genImg(description);
      }
    })

    box.append(input, this.nodes.btn)

    this.nodes.wrapper.append(box, this.nodes.imgGallery);

    return this.nodes.wrapper;
  }

  loadImg(imgUrl: string, imgCaption?: string) {
    this.nodes.img = make('img', styles['spectrum-img'], {
      src: imgUrl
    }) as HTMLImageElement;
    // first remove all child
    this.nodes.wrapper!.innerHTML = ''
    this.nodes.wrapper!.appendChild(this.nodes.img);

    if (imgCaption) {
      this.nodes.caption = make('div', null, {
        contentEditable: 'true',
        onkeydown: (event: KeyboardEvent) => {
          if (event.key === 'Enter') {
            event.preventDefault();
          }
        }
      });
      this.nodes.caption.innerHTML = imgCaption;
      this.nodes.wrapper!.appendChild(this.nodes.caption);
    }
  }

  async genImg(description: string) {

    this.btnLoading = true;
    this.nodes.btn!.innerHTML = '';
    this.nodes.btn!.appendChild(make('div', [styles['overlay'], this.api.styles.loader]));

    if (!this.nodes.imgGallery) {
      this.nodes.imgGallery = make('div', styles['img-gallery'])
    }

    const controller = new AbortController();
    const requestTimeoutId = setTimeout(() => controller.abort(), 60000);

    const {url, method, credentials} = this.config
    const res = await fetch(url, {
      method,
      headers: {
        ...credentials
      },
      body: JSON.stringify({
        prompt: description,
        n: 4
      }),
      signal: controller.signal
    })

    this.nodes.btn!.innerHTML = 'Generate';
    this.btnLoading = false;
    clearTimeout(requestTimeoutId);
    if (res.headers.get('content-type')?.includes('application/json') && res.ok) {
      const result = await res.json()
      const imgUrls: string[] = result.data.map((item: any) => item.url)
      this.nodes.imgGallery.innerHTML = '';

      if (imgUrls && imgUrls.length) {
        imgUrls.forEach(imgUrl => {
          const imgEl = make('img', null, {
            src: imgUrl
          }) as HTMLImageElement;
          this.createThumbImg({url: imgUrl, caption: description, description: description})
        })
      } else {
        const noResult = make('div', styles['no-result']);
        noResult.innerText = 'Nothing match your description, please try again.';
        this.nodes.imgGallery!.appendChild(noResult);
      }

    } else {
      this.api.notifier.show({
        message: 'Can not generate image now, please try again later.',
        style: 'error'
      })
    }
  }

  createThumbImg(imgData: spectrumData) {
    const imgWrapper = make('div', styles['gallery-wrapper']);
    const img = make('img', styles['img-thumb'], {
      src: imgData.url,
      onclick: () => this.downloadImg(imgData)
    });

    imgWrapper.append(img);
    this.nodes.imgGallery!.append(imgWrapper);
  }

  downloadImg(imgData: spectrumData) {
    this.loadImg(imgData.url, imgData.caption);
    this.data = imgData;
  }

  save(blockContent: HTMLElement): spectrumData {
    return {
      ...this.data,
        caption: this.nodes.caption?.innerHTML || ''
    };
  }

  /**
   * Validates Block data after saving
   * @link https://editorjs.io/tools-api#validate
   *
   * @param {spectrumData} savedData
   * @returns {boolean} true if data is valid, otherwise false
   */
  validate(savedData: spectrumData): boolean {
    return !!savedData.url.trim();
  }

  /**
   * Clear Tools stuff: cache, variables, events.
   * Called when Editor instance is destroying.
   * @link https://editorjs.io/tools-api#destroy
   *
   * @returns {void}
   */
  // destroy() {}

  /**
   * Clean unwanted HTML tags or attributes
   * @link https://editorjs.io/tools-api#sanitize
   *
   * @returns {{[string]: boolean|object}} - Sanitizer rules
   */
  // static get sanitize() {
  //   return {};
  // }

  /**
   * Shortcut that fires render method and inserts new Block
   * @link https://editorjs.io/tools-api#shortcut
   *
   * @returns {string}
   */
  // static get shortcut() {
  //   // return 'CMD+SHIFT+I';
  // }

  /**
   * Config allows Tool to specify how it can be converted into/from another Tool
   *
   * @link https://editorjs.io/tools-api#conversionconfig
   *
   * @returns {{export: string|function, import: string|function}}
   */
  // static get conversionConfig() {
  //   // return {
  //   //   export: (data) => {
  //   //     return data.items.join('.'); // in this example, all list items will be concatenated to an export string
  //   //   },
  //   //
  //   //   /**
  //   //    * In this example, List Tool creates items by splitting original text by a dot symbol.
  //   //    */
  //   //   import: (string) => {
  //   //     const items = string.split('.');
  //   //
  //   //     return {
  //   //       items: items.filter( (text) => text.trim() !== ''),
  //   //       type: 'unordered'
  //   //     };
  //   //   }
  //   // };
  // }


  /**
   * This flag tells core that current tool supports the read-only mode
   * @link https://editorjs.io/tools-api#isreadonlysupported
   *
   * @returns {boolean}
   */
  // static get isReadOnlySupported() {
  //   return true;
  // }

  /**
   * LIFE CYCLE HOOKS
   *
   * These methods are called by Editor.js core
   * @link https://editorjs.io/tools-api#lifecycle-hooks
   */

  /**
   * Called after Block contents is added to the page
   */
  // rendered() {}

  /**
   * Called each time Block contents is updated
   */
  // updated() {}

  /**
   * Called after Block contents is removed from the page but before Block instance deleted
   */
  // removed() {}

  /**
   * Called after Block is moved by move tunes or through API
   *
   * @param {MoveEvent} event
   */
  // moved(event) {}
};
