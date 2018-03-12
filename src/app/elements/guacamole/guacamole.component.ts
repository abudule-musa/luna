import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {CookieService} from 'ngx-cookie-service';
import {HttpService, LocalStorageService, LogService} from '../../app.service';
import {DataStore, User} from '../../globals';
import {DomSanitizer} from '@angular/platform-browser';
import {environment} from '../../../environments/environment';
import {NavList} from '../../ControlPage/control/control.component';
import {logger} from 'codelyzer/util/logger';

@Component({
  selector: 'app-element-guacamole',
  templateUrl: './guacamole.component.html',
  styleUrls: ['./guacamole.component.scss']
})
export class ElementGuacamoleComponent implements OnInit {
  @Input() host: any;
  @Input() userid: any;
  @Input() token: string;
  @Input() index: number;
  target: string;
  @ViewChild('rdp') el: ElementRef;

  constructor(private sanitizer: DomSanitizer,
              private _http: HttpService,
              private _cookie: CookieService,
              private _logger: LogService,
              private _localStorage: LocalStorageService) {
  }

  ngOnInit() {
    // /guacamole/api/tokens will redirect to http://guacamole/api/tokens
    if (this.token) {
      this.userid = this._localStorage.get('user');
      this._http.get_guacamole_token(this.userid).subscribe(
        data => {
          DataStore.guacamole_token = data['authToken'];
          this._http.guacamole_token_add_asset(this.token, data['authToken']).subscribe(
            data2 => {
              this._logger.debug(data);
              this.target = document.location.origin + '/guacamole/#/client/' + data2['result'] + '?token=' + data['authToken'];
            },
            error2 => {
              this._logger.error(error2);
            }
          );
        });
    } else {
      const base = window.btoa(this.host.id + '\0' + 'c' + '\0' + 'jumpserver');
      if (environment.production) {
        if (DataStore.guacamole_token) {
          this._http.guacamole_add_asset(User.id, this.host.id, this.userid).subscribe(
            data => {
              this.target = document.location.origin + '/guacamole/#/client/' + base + '?token=' + DataStore.guacamole_token;
            },
            error2 => {
              this._logger.error(error2);
            }
          );
        } else {
          this._http.get_guacamole_token(User.id).subscribe(
            data => {
              // /guacamole/client will redirect to http://guacamole/#/client
              DataStore.guacamole_token = data['authToken'];

              this._http.guacamole_add_asset(User.id, this.host.id, this.userid).subscribe(
                data2 => {
                  this.target = document.location.origin + '/guacamole/#/client/' + base + '?token=' + DataStore.guacamole_token;
                },
                error2 => {
                  this._logger.error(error2);
                }
              );
              // '/guacamole/#/client/' + base + '?token=' + data['authToken'];
            },
            error2 => {
              this._logger.error(error2);
            }
          );
        }
      } else {
        this.target = this._cookie.get('guacamole');
      }
    }

    NavList.List[this.index].Rdp = this.el.nativeElement;
  }

  trust(url) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  Disconnect() {
    NavList.List[this.index].connected = false;
  }

  active() {
    this._logger.debug('focus');
    this.el.nativeElement.focus();
  }

}