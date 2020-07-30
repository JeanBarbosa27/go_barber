import 'reflect-metadata';
import { startOfHour, isBefore, getHours } from 'date-fns';
import { injectable, inject } from 'tsyringe';

import AppError from '@shared/errors/AppError';
import Appointment from '@modules/appointments/infra/typeorm/entities/Appointment';
import IAppointmentsRepository from '@modules/appointments/repositories/IAppointmentsRepository';

interface IRequestDTO {
  provider_id: string;
  client_id: string;
  date: Date;
}

@injectable()
class CreateAppointmentService {
  constructor(
    @inject('AppointmentsRepository')
    private appointmentsRepository: IAppointmentsRepository,
  ) {}

  public async execute({
    provider_id,
    client_id,
    date,
  }: IRequestDTO): Promise<Appointment> {
    const appointmentDate = startOfHour(date);
    const appointmentInSameDate = await this.appointmentsRepository.findByDate(
      appointmentDate,
    );
    const appointmentHour = getHours(appointmentDate);

    if (provider_id === client_id) {
      throw new AppError("You can't create an appointment with yourself");
    }

    if (appointmentHour < 8 || appointmentHour > 17) {
      throw new AppError('You must create an appointment between 8am and 5pm');
    }

    if (isBefore(appointmentDate, Date.now())) {
      throw new AppError("You can't create an appointment in the past");
    }

    if (appointmentInSameDate) {
      throw new AppError('This appointment is already booked');
    }

    const appointment = await this.appointmentsRepository.create({
      provider_id,
      client_id,
      date: appointmentDate,
    });

    return appointment;
  }
}

export default CreateAppointmentService;
