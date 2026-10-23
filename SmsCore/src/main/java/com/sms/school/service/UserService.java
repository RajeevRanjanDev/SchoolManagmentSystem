package com.sms.school.service;

import com.sms.school.dto.request.CreateUserRequest;
import com.sms.school.dto.response.StudentResponse;
import com.sms.school.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserService {

    User createUser(Long schoolId, CreateUserRequest request);

    User getUserById(Long schoolId, Long userId);

    Page<User> getAllUsers(Long schoolId, Pageable pageable);
}
