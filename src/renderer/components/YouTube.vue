<template>
<section class="section">

  <b-field>
    <div class="control">
      <span class="button is-static">Download</span>
    </div>
    <b-select v-model="config.action" placeholder="Action">
      <option value="downloadAudio">Audio</option>
      <option value="downloadVideo">Video</option>
    </b-select>
    <div class="control">
      <span class="button is-static">from</span>
    </div>
    <b-input v-model="url" placeholder="Youtube URL" expanded></b-input>

    <div class="control">
      <button class="button is-info" @click="$store.dispatch('checkUrl', { url })">Go!</button>
    </div>
  </b-field>

  <b-field grouped>
    <b-field expanded>
      <div class="control">
        <span class="button is-static">Save to</span>
      </div>
      <b-input v-model="config.outputDirectory" expanded readonly></b-input>
      <div class="control">
        <button class="button" @click="selectOutputDirectory">Select</button>
      </div>
      <div class="control">
        <button class="button" @click="$electron.remote.shell.openItem($store.state.config.outputDirectory)">Open</button>
      </div>
    </b-field>

    <b-field expanded>
      <div class="control">
        <span class="button is-static">Template</span>
      </div>
      <div class="control">
        <b-dropdown>
          <button class="button" slot="trigger">
            <span class="icon"><i class="fa fa-angle-down"></i></span>
          </button>
          <b-dropdown-item @click="config.outputTemplate = '%(title)s-%(id)s.%(ext)s'">Loose</b-dropdown-item>
          <b-dropdown-item @click="config.outputTemplate = '%(uploader)s/%(title)s-%(id)s.%(ext)s'">Sorted by uploader</b-dropdown-item>
          <b-dropdown-item @click="config.outputTemplate = '%(playlist_title)s-%(playlist_id)s/%(playlist_index)s-%(title)s-%(id)s.%(ext)s'">Sorted by playlist</b-dropdown-item>
          <b-dropdown-item @click="config.outputTemplate = '%(extractor)s/%(uploader)s/%(title)s-%(id)s.%(ext)s'">Sorted by extractor then uploader</b-dropdown-item>
        </b-dropdown>
      </div>
      <b-input v-model="config.outputTemplate" expanded></b-input>
    </b-field>
  </b-field>

  <b-field grouped>
    <b-field expanded>
      <div class="control">
        <span class="button is-static">Format</span>
      </div>
      <div class="control">
        <b-dropdown>
          <button class="button" slot="trigger">
            <span class="icon"><i class="fa fa-angle-down"></i></span>
          </button>
          <b-dropdown-item @click="config.format = 'bestvideo+bestaudio/best'">Best video + audio</b-dropdown-item>
          <b-dropdown-item @click="config.format = 'best'">Best video + audio ( No converting )</b-dropdown-item>
          <b-dropdown-item @click="config.format = '(mp4)[height <= 720]'">720p MP4</b-dropdown-item>
          <b-dropdown-item @click="config.format = 'bestvideo[height <= 480]+bestaudio/best[height <= 480]'">480p Archive</b-dropdown-item>
        </b-dropdown>
      </div>
      <b-input v-model="config.format" placeholder="bestvideo+bestaudio/best" expanded></b-input>
    </b-field>

    <b-field>
      <div class="control">
        <span class="button is-static">Audio Format</span>
      </div>
      <b-select v-model="config.audioFormat">
        <option value="mp3">MP3</option>
      </b-select>
    </b-field>

    <b-field>
      <div class="control">
        <span class="button is-static">Audio Quality</span>
      </div>
      <b-select v-model="config.audioQuality">
        <option value="3">Better</option>
        <option value="5">Default</option>
        <option value="7">Worse</option>
      </b-select>
    </b-field>

    <b-field>
      <div class="control">
        <span class="button is-static">Rate</span>
      </div>
      <b-select v-model="config.rateLimit">
        <option :value="null">Unlimited</option>
        <option v-for="o in ['300K', '600K', '800K', '1M', '2M', '5M']" :value="o">{{ o }}</option>
      </b-select>
    </b-field>

  </b-field>

  <div class="tabs is-boxed">
    <ul>
      <li :class="{ 'is-active': tabIndex === 0 }">
        <a @click="tabIndex = 0">Ongoing</a>
      </li>
      <li :class="{ 'is-active': tabIndex === 1}">
        <a @click="tabIndex = 1">Results</a>
      </li>
    </ul>
  </div>

  <div class="task-list">
    <p v-if="queue.length === 0">Nothing here!</p>
    <div class="task" v-for="task in queue">
      <div class="media">
        <figure class="media-left">
          <p class="image is-16by9">
            <img v-if="task.thumbnail" :src="task.thumbnail">
            <img v-if="!task.thumbnail" style="background-color: #ddd;">
          </p>
        </figure>
        <div class="media-content">

          <div class="level">
            <div class="level-left">
              <div class="level-item">
                <div class="panel">
                  <div class="panel-item">
                    <a @click="$electron.remote.shell.openExternal(task.webpage_url)">{{ task.title }}</a><span v-if="task.duration"> ({{ task.duration | duration }})</span>
                  </div>
                  <div class="panel-item" v-if="task.uploader"><small>uploaded by <a @click="$electron.remote.shell.openExternal(task.uploader_url)">{{ task.uploader }}</a></small></div>
                </div>
              </div>
            </div>

            <div class="level-right">
              <div class="level-item">
                <div class="panel">
                  <div class="panel-item">
                    <b-field class="no-mouse">
                      <b-radio-button v-model="task.progress.action" native-value="queued" size="is-small" type="is-dark"><span>Queued</span></b-radio-button>
                      <b-radio-button v-model="task.progress.action" native-value="download" size="is-small" type="is-info"><span>Downloading</span> <span class="icon" v-if="task.progress.action === 'download'"><i class="fa fa-spinner fa-spin"></i></span></b-radio-button>
                      <b-radio-button v-model="task.progress.action" native-value="ffmpeg" size="is-small" type="is-warning"><span>Converting</span> <span class="icon" v-if="task.progress.action === 'ffmpeg'"><i class="fa fa-spinner fa-spin"></i></span></b-radio-button>
                      <b-radio-button v-model="task.progress.action" native-value="complete" size="is-small" type="is-success"><span>Completed</span></b-radio-button>
                    </b-field>
                  </div>
                  <div class="panel-item"><progress class="progress" v-if="task.progress.action === 'download'" :value="task.progress.percent" max="100"></progress></div>
                  <div class="panel-item has-text-right" style="font-size: 13px" v-if="task.progress.action === 'download'">
                    {{ task.progress.percent }}% of {{ task.progress.size }} at {{ task.progress.rate }} ETA {{ task.progress.eta }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <b-field v-if="task.progress.action === 'complete'">
            <div class="control">
              <button class="button is-success" @click="$electron.remote.shell.showItemInFolder(task.progress.path)">Open</button>
            </div>
            <b-input :value="task.progress.path" readonly expanded></b-input>
          </b-field>

        </div>
      </div>

    </div>
  </div>

</section>
</template>

<script>
import { cloneDeep } from 'lodash';

export default {
  data() {
    return {
      url: null,
      tabIndex: 0,
      config: cloneDeep(this.$store.state.config),
    };
  },
  watch: {
    config: {
      handler(val) {
        this.$store.commit('setConfig', val);
      },
      deep: true,
    },
  },
  computed: {
    queue() {
      if (this.tabIndex === 0) {
        return this.$store.state.queue.filter(task => task.progress.action !== 'complete');
      }
      return this.$store.state.queue.slice().reverse();
    },
  },
  methods: {
    selectOutputDirectory() {
      this.$electron.remote.dialog.showOpenDialog({
        title: 'Save to directory',
        defaultPath: this.config.outputDirectory,
        properties: ['openDirectory'],
      }, (paths) => {
        if (paths && paths.length > 0) {
          this.config.outputDirectory = paths[0];
        }
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.section {
  display: flex;
  flex-direction: column;

  > .content {
    flex: 0 0 auto;
  }

  > .queue {
    flex: 1;
    display: flex;
    flex-direction: column;

    .card-header {
      flex: 0 0 auto;
    }

    .card-content {
      flex: 1;
      overflow-y: auto;
    }
  }
}

.task-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.task {
  padding-bottom: 1em;
  margin-bottom: 1em;

  &:not(:last-child) {
    border-bottom: 1px solid #333;
  }

  .media {
    margin-bottom: 0;
  }
  .media-left {
    width: 200px;
  }

  .level {
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .progress {
    border-radius: 0;
  }

  .description {
    white-space: pre-wrap;

    &:after {
      content: '...';
    }
  }
}

.tabs {
  margin-bottom: 0;
}

.no-mouse {
  pointer-events: none;
}
</style>