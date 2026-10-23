package com.sms.school.service.impl;

import com.sms.school.dto.request.CreateUserRequest;
import com.sms.school.entity.Role;
import com.sms.school.entity.School;
import com.sms.school.entity.User;
import com.sms.school.exception.BusinessException;
import com.sms.school.exception.ResourceNotFoundException;
import com.sms.school.repository.RoleRepository;
import com.sms.school.repository.SchoolRepository;
import com.sms.school.repository.UserRepository;
import com.sms.school.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final SchoolRepository schoolRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public User createUser(Long schoolId, CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Email '" + request.getEmail() + "' is already registered");
        }

        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new ResourceNotFoundException("School", schoolId));

        Role role = roleRepository.findByName(request.getRole())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Role not found: " + request.getRole()));

        User user = User.builder()
                .school(school)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .gender(request.getGender())
                .dateOfBirth(request.getDateOfBirth())
                .address(request.getAddress())
                .roles(Set.of(role))
                .build();

        return userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public User getUserById(Long schoolId, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (!user.getSchool().getId().equals(schoolId)) {
            throw new ResourceNotFoundException("User", userId);
        }
        return user;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<User> getAllUsers(Long schoolId, Pageable pageable) {
        return userRepository.findBySchoolIdAndDeletedFalse(schoolId, pageable);
    }
}
