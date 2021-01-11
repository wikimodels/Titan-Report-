import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of, from } from 'rxjs';
import { catchError, map, tap, finalize, switchMap } from 'rxjs/operators';
import * as moment from 'moment';
import { v4 as uuidv4 } from 'uuid';

import { UserInfo } from 'src/models/user-info.model';
import { DeviceDetectorService } from 'ngx-device-detector';
import {
  Question,
  Questionnaire,
  QuestionType,
} from 'src/models/questionnaire.model';

import { GET_QUESTIONNAIRE_BY_QID } from 'consts/urls.consts';
import { DexieDbOpsService } from './dexie-indexedDb/dexie-idbs-ops.service';

const formatDisplayDate = 'DD-MM-YY';
const formatDisplayTime = 'HH:mm';

@Injectable({
  providedIn: 'root',
})
export class QuestionnaireService {
  constructor(
    private http: HttpClient,
    private dexieIndexedDbService: DexieDbOpsService
  ) {}

  private _questionnaireSubj = new BehaviorSubject<Questionnaire>({
    questionnaire_id: null,
    user_info: null,
    questions: [],
    creation_date: null,
    modification_date: null,
  });
  questionnaireSubj$ = this._questionnaireSubj.asObservable();

  getQuestionnaireSubj(): Questionnaire {
    return this._questionnaireSubj.getValue();
  }

  setQuestionnaireSubj(questionnaire: Questionnaire) {
    this._questionnaireSubj.next(questionnaire);
  }

  async getQuestionnaireByQid(qid: string) {
    await this.dexieIndexedDbService.clearQuestionnaireDb();
    this.http
      .get<Questionnaire>(GET_QUESTIONNAIRE_BY_QID(qid))
      .pipe(
        tap((value: Questionnaire) => {
          this.setQuestionnaireSubj(value);
        }),
        switchMap((value: Questionnaire) =>
          from(this.dexieIndexedDbService.addQuestionnaire(value))
        ),
        catchError((error) => {
          console.log(error);
          return throwError(error);
        })
      )
      .subscribe();
  }

  updateInternally(question: Question) {
    const questionnaire = this.getQuestionnaireSubj();
    const index = question.question_id - 1;
    questionnaire.questions[index] = question;
    console.log('updated questionnaire ', questionnaire);
    this.setQuestionnaireSubj(questionnaire);
  }

  getFirstQuestionUrl() {
    return this.getQuestionnaireSubj().first_question_url;
  }
}
