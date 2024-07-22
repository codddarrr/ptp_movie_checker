import axios from 'axios';
import FormData from 'form-data';

const UPLOAD_URL = 'https://ptpimg.me/upload.php';

class UploadFailed extends Error {
  constructor(message) {
    super(message);
    this.name = 'UploadFailed';
  }
}

class PtpImgUploader {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  handleResult(res) {
    return `https://ptpimg.me/${res.code}.${res.ext}`;
  }

  async perform(resp) {
    if (resp.status === 200) {
      try {
        return resp.data.map(r => this.handleResult(r));
      } catch (error) {
        throw new UploadFailed(
          `Failed decoding body: ${error.message}\n${JSON.stringify(resp.data)}`
        );
      }
    } else {
      throw new UploadFailed(
        `Failed. Status ${resp.status}: ${JSON.stringify(resp.data)}`
      );
    }
  }

  async uploadUrl(imageUrl) {
    const form = new FormData();
    form.append('link-upload', imageUrl);
    form.append('api_key', this.apiKey);

    const headers = {
      ...form.getHeaders(),
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0',
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.5',
      'X-Requested-With': 'XMLHttpRequest',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-GPC': '1',
      Priority: 'u=1',
      Referer: 'https://ptpimg.me/',
    };

    try {
      const resp = await axios.post(UPLOAD_URL, form, {
        headers,
        withCredentials: true,
      });
      return this.perform(resp);
    } catch (error) {
      throw new UploadFailed(`Upload failed: ${error.message}`);
    }
  }
}

export default PtpImgUploader;
