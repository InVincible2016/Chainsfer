import React from 'react'
import { withStyles } from '@material-ui/core'
import Stepper from '@material-ui/core/Stepper'
import Step from '@material-ui/core/Step'
import StepLabel from '@material-ui/core/StepLabel'

const stepsByActionType = {
  'receive': ['Security Answer', 'Wallet', 'Review'],
  'transfer': ['Wallet', 'Recipient', 'Review']
}

class MyStepper extends React.Component {
  render () {
    const { actionType, step } = this.props
    const steps = stepsByActionType[actionType]
    return (
      <Stepper activeStep={step}>
        {steps.map((label, index) => (
          <Step key={index}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
    )
  }
}

const style = theme => ({
})

export default withStyles(style)(MyStepper)
