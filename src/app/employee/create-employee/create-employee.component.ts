import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl, FormArray, FormControl } from '@angular/forms';
import { CustomValidators } from '../../shared/custom.validators';
import { ActivatedRoute } from '@angular/router';
import { EmployeeService } from '../employee.service';
import { IEmployee } from '../IEmployee';

@Component({
  selector: 'app-create-employee',
  templateUrl: './create-employee.component.html',
  styleUrls: ['./create-employee.component.css']
})
export class CreateEmployeeComponent implements OnInit {

  employeeForm: FormGroup;

  validationMessages = {
    fullName: {
      required: 'Full Name is required.',
      minlength: 'Full Name must be greater than 2 characters.',
      maxlength: 'Full Name must be less than 10 characters.'
    },
    email: {
      required: 'Email is required.',
      emailDomain: 'Email domain should be dell.com'
    },
    confirmEmail: {
      required: 'Confirm Email is required.'
    },
    emailGroup: {
      emailMismatch: 'Email and Confirm Email do not match'
    },
    phone: {
      required: 'Phone is required.'
    },
  };

  formErrors = {};

  constructor(private fb: FormBuilder,
              private route: ActivatedRoute,
              private employeeService: EmployeeService) { }

  ngOnInit() {
    this.employeeForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(10)]],
      contactPreference: ['email'],
      emailGroup: this.fb.group({
        email: ['', [Validators.required, CustomValidators.emailDomain('dell.com')]],
        confirmEmail: ['', Validators.required]
      }, {validator: matchEmail}),
      phone: [''],
      // Create skills form group
      skills: this.fb.array([
        this.addSkillFormGroup()
      ])
    });

    this.employeeForm.get('contactPreference').valueChanges.subscribe((data: string) => {
      this.onContactPreferenceChange(data);
    });

    this.employeeForm.valueChanges.subscribe((data) => {
      this.logValidationErrors(this.employeeForm);
    });

    this.route.paramMap.subscribe(params => {
      const empId = +params.get('id');
      if (empId) {
        this.getEmployee(empId);
      }
    });
  }

  getEmployee(id: number) {
    this.employeeService.getEmployee(id).subscribe(
      (employee: IEmployee) => this.editEmployee(employee),
      (err: any) => console.log(err)
    );
  }

  editEmployee(employee: IEmployee) {
    this.employeeForm.patchValue({
      fullName: employee.fullName,
      contactPreferance: employee.contactPreference,
      emailGroup: {
        email: employee.email,
        confirmEmail: employee.email
      },
      phone: employee.phone
    });
  }

  addSkillButtonClick(): void {
    (this.employeeForm.get('skills') as FormArray).push(this.addSkillFormGroup());
  }

  removeSkillButtonClick(skillGroupIndex: number): void {
    (this.employeeForm.get('skills') as FormArray).removeAt(skillGroupIndex);
  }
  addSkillFormGroup(): FormGroup {
    return this.fb.group({
      skillName: ['', Validators.required],
      experienceInYears: ['', Validators.required],
      proficiency: ['', Validators.required]
    });
  }

  onContactPreferenceChange(selectedValue: string): void {
    if (selectedValue === 'phone') {
      this.employeeForm.get(selectedValue).setValidators(Validators.required);
      this.employeeForm.controls.emailGroup.get('email').clearValidators();
    } else {
      this.employeeForm.controls.emailGroup.get(selectedValue).setValidators(Validators.required);
      this.employeeForm.get('phone').clearValidators();
    }
    this.employeeForm.get('phone').updateValueAndValidity();
    this.employeeForm.controls.emailGroup.get('email').updateValueAndValidity();
  }

  logValidationErrors(group: FormGroup = this.employeeForm): void {
    Object.keys(group.controls).forEach((key: string) => {
      const abstractControl = group.get(key);

      this.formErrors[key] = '';
      if (abstractControl && !abstractControl.valid &&
        (abstractControl.touched || abstractControl.dirty ||
         abstractControl.value !== '')) {
        const messages = this.validationMessages[key];

        for (const errorKey in abstractControl.errors) {
          if (errorKey) {
            this.formErrors[key] += messages[errorKey] + ' ';
          }
        }
      }

      if (abstractControl instanceof FormGroup) {
        this.logValidationErrors(abstractControl);
      }

    });
  }

  onLoadDataClick(): void {
    const formArray1 = this.fb.array([
      new FormControl('John', Validators.required),
      new FormControl('IT', Validators.required),
      new FormControl('Male', Validators.required),
    ]);

    const formGroup = this.fb.group([
      new FormControl('John', Validators.required),
      new FormControl('IT', Validators.required),
      new FormControl('Male', Validators.required),
    ]);

    console.log(formArray1);
    console.log(formGroup);
  }

  onSubmit(): void {
    console.log(this.employeeForm);
  }
}

function matchEmail(group: AbstractControl): {[key: string]: any} | null {
  const emailControl = group.get('email');
  const confirmEmailControl = group.get('confirmEmail');
  if (emailControl.value === confirmEmailControl.value ||
    (confirmEmailControl.pristine && confirmEmailControl.value === '')) {
    return null;
  } else {
    return { emailMismatch: true };
  }
}
