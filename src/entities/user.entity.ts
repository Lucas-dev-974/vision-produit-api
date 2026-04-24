import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BeforeInsert,
} from 'typeorm';
import { randomUUID } from 'crypto';

export enum UserRole {
  PRODUCER = 'producer',
  BUYER = 'buyer',
  ADMIN = 'admin',
}

export enum UserStatus {
  PENDING_EMAIL = 'pending_email',
  PENDING_ADMIN = 'pending_admin',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

@Entity('users')
export class User {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash!: string;

  @Column({ type: 'enum', enum: UserRole })
  role!: UserRole;

  @Column({ type: 'enum', enum: UserStatus })
  status!: UserStatus;

  @Column({ type: 'varchar', length: 14, nullable: true })
  siret!: string | null;

  @Column({ type: 'varchar', length: 255, name: 'company_name', nullable: true })
  companyName!: string | null;

  @Column({ type: 'varchar', length: 10, name: 'naf_code', nullable: true })
  nafCode!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 500, name: 'profile_photo_url', nullable: true })
  profilePhotoUrl!: string | null;

  @Column({ type: 'double precision', name: 'location_lat', nullable: true })
  locationLat!: number | null;

  @Column({ type: 'double precision', name: 'location_lng', nullable: true })
  locationLng!: number | null;

  @Column({ type: 'varchar', length: 255, name: 'address_line', nullable: true })
  addressLine!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string | null;

  @Column({ type: 'varchar', length: 10, name: 'postal_code', nullable: true })
  postalCode!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @BeforeInsert()
  setId(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
